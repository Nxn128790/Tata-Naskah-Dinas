const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const { DOMParser } = require('xmldom');
const path = require('path');
const fs = require('fs');

// Tentukan path ke template DOCX Anda
// Path ini relatif terhadap direktori tempat 'generate-document.js' berada
const TEMPLATE_FILE_NAME = 'template_spt.docx';
const TEMPLATE_PATH = path.resolve(__dirname, TEMPLATE_FILE_NAME);

// Fungsi Netlify
exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Metode tidak diizinkan. Harap gunakan POST.' }),
        };
    }

    let content;
    try {
        // Coba baca template dari jalur yang ditentukan
        content = fs.readFileSync(TEMPLATE_PATH, 'binary');
    } catch (readError) {
        console.error("Error membaca template_spt.docx:", readError);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Gagal membaca file template.',
                error: readError.message,
                templatePathChecked: TEMPLATE_PATH
            }),
        };
    }

    try {
        const data = JSON.parse(event.body);

        const zip = new PizZip(content);
        const doc = new new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            parser: (tag) => {
                return {
                    get(scope) {
                        return scope[tag];
                    }
                };
            }
        });

        doc.setData({
            namaPegawai: data.namaPegawai || '[Nama Pegawai Kosong]',
            nip: data.nip || '[NIP Kosong]',
            jabatan: data.jabatan || '[Jabatan Kosong]',
            tujuan: data.tujuan || '[Tujuan Kosong]',
            tanggalBerangkat: data.tanggalBerangkat || '[Tanggal Berangkat Kosong]',
            tanggalKembali: data.tanggalKembali || '[Tanggal Kembali Kosong]',
        });

        try {
            doc.render();
        } catch (error) {
            console.error("Error saat rendering dokumen:", error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Gagal mengisi dokumen. Periksa template atau data yang dikirim.', error: error.message }),
            };
        }

        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="Surat_Perintah_Tugas.docx"',
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