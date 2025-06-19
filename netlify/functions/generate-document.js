const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const { DOMParser } = require('xmldom'); // Pastikan ini 'xmldom', bukan '@xm-l/xmldom'
const path = require('path');
const fs = require('fs'); // Modul File System bawaan Node.js untuk membaca file

// Tentukan path ke template DOCX Anda
const TEMPLATE_FILE_NAME = 'template_spt.docx';
const TEMPLATE_PATH = path.resolve(__dirname, TEMPLATE_FILE_NAME);

// Fungsi utama Netlify Function
exports.handler = async function(event, context) {
    // Memastikan hanya permintaan POST yang diterima
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Metode tidak diizinkan. Harap gunakan POST.' }),
        };
    }

    let content;
    try {
        // Membaca isi file template DOCX secara biner
        content = fs.readFileSync(TEMPLATE_PATH, 'binary');
    } catch (readError) {
        console.error("Error membaca template_spt.docx:", readError);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Gagal membaca file template. Pastikan template_spt.docx ada dan terunggah.',
                error: readError.message,
                templatePathAttempted: TEMPLATE_PATH
            }),
        };
    }

    try {
        // Mengambil data yang dikirim dari formulir (front-end)
        const data = JSON.parse(event.body);

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, { // Baris ini sudah benar (hanya satu 'new')
            paragraphLoop: true, // Penting untuk perulangan paragraf
            linebreaks: true,
            parser: (tag) => {
                return {
                    get(scope) {
                        return scope[tag];
                    }
                };
            }
        });

        // ISI DATA KE TEMPLATE
        // 'daftarPegawai' sekarang adalah sebuah array yang berisi objek-objek pegawai
        doc.setData({
            daftarPegawai: data.daftarPegawai || [], // Data array untuk perulangan
            jenispengawasan: data.jenispengawasan || '[Jenis Pengawasan Kosong]',
            opd: data.opd || '[OPD Kosong]',
            tanggalmulai: data.tanggalmulai || '[Tanggal Mulai Kosong]',
            tanggalberakhir: data.tanggalberakhir || '[Tanggal Berakhir Kosong]',
            bulan: data.bulan || '[Bulan Kosong]',
            tahun: data.tahun || '[Tahun Kosong]',
        });

        try {
            doc.render(); // Proses pengisian template dengan data
        } catch (error) {
            console.error("Error saat rendering dokumen:", error);
            // Tambahkan detail error Docxtemplater untuk debugging yang lebih baik
            if (error.properties) {
                console.error(JSON.stringify({
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    properties: error.properties
                }, null, 2));
            }
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Gagal mengisi dokumen. Periksa template atau data yang dikirim.', error: error.message }),
            };
        }

        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        // Mengirim file DOCX kembali ke front-end
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="Surat_Tugas.docx"',
            },
            body: buf.toString('base64'),
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('Terjadi kesalahan umum di Netlify Function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Terjadi kesalahan internal pada server.', error: error.message }),
        };
    }
};