const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const { DOMParser } = require('xmldom'); // Pastikan ini 'xmldom', bukan '@xm-l/xmldom'
const path = require('path');
const fs = require('fs'); // Modul File System bawaan Node.js untuk membaca file

// Tentukan path ke template DOCX Anda
// Path ini relatif terhadap direktori tempat 'generate-document.js' berada.
// Netlify akan memastikan file ini di-bundle bersama fungsi karena konfigurasi netlify.toml.
const TEMPLATE_FILE_NAME = 'template_spt.docx';
const TEMPLATE_PATH = path.resolve(__dirname, TEMPLATE_FILE_NAME);

// Ini adalah fungsi utama yang akan dipanggil oleh Netlify setiap kali ada permintaan HTTP.
// Fungsi ini dirancang sebagai Serverless Function.
exports.handler = async function(event, context) {
    // Memastikan hanya permintaan POST yang diterima oleh fungsi ini.
    // Formulir dari front-end akan mengirim data menggunakan metode POST.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Kode status 405 berarti 'Method Not Allowed'
            body: JSON.stringify({ message: 'Metode tidak diizinkan. Harap gunakan POST.' }),
        };
    }

    let content;
    try {
        // Membaca isi file template DOCX secara biner dari jalur yang ditentukan.
        // 'binary' diperlukan karena file DOCX adalah data biner.
        content = fs.readFileSync(TEMPLATE_PATH, 'binary');
    } catch (readError) {
        console.error("Error membaca template_spt.docx:", readError);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Gagal membaca file template. Pastikan template_spt.docx ada dan terunggah.',
                error: readError.message,
                templatePathAttempted: TEMPLATE_PATH // Memberikan informasi jalur yang dicoba
            }),
        };
    }

    try {
        // Mengambil data yang dikirim dari formulir di front-end.
        // Data ini berupa string JSON, jadi kita perlu mengubahnya menjadi objek JavaScript.
        const data = JSON.parse(event.body);

        // Menginisialisasi PizZip untuk membuka dan memanipulasi file DOCX.
        const zip = new PizZip(content);

        // Menginisialisasi Docxtemplater. Ini adalah library yang akan mengisi placeholder di template.
        // Konfigurasi 'paragraphLoop' dan 'linebreaks' membantu penanganan teks dan struktur di dalam dokumen.
        const doc = new Docxtemplater(zip, { // <--- Ini adalah baris yang diperbaiki, hanya satu 'new'
            paragraphLoop: true, // Untuk memungkinkan pengulangan paragraf (misal jika ada daftar)
            linebreaks: true,    // Untuk menangani baris baru di teks placeholder
            parser: (tag) => {   // Mengatur bagaimana Docxtemplater mengenali placeholder (misalnya, {namaPegawai})
                return {
                    get(scope) {
                        return scope[tag]; // Mengambil nilai dari objek 'data' berdasarkan nama placeholder
                    }
                };
            }
        });

        // Mengisi data ke dalam template DOCX.
        // Kunci (keys) di sini harus SAMA PERSIS dengan nama placeholder di template_spt.docx Anda,
        // dan juga sama dengan nama 'name' di input form HTML Anda.
        doc.setData({
            namaPegawai: data.namaPegawai || '[Nama Pegawai Kosong]', // Ambil dari form
            nip: data.nip || '[NIP Kosong]',                       // Ambil dari form
            pangkatGolongan: data.pangkatGolongan || '[Pangkat/Golongan Kosong]', // Ambil dari form
            jabatan: data.jabatan || '[Jabatan Kosong]',             // Ambil dari form
            tujuan: data.tujuan || '[Tujuan Kosong]',
            tanggalBerangkat: data.tanggalBerangkat || '[Tanggal Berangkat Kosong]',
            tanggalKembali: data.tanggalKembali || '[Tanggal Kembali Kosong]',
            // Anda bisa menambahkan placeholder lain di sini sesuai kebutuhan template SPT Anda
        });

        try {
            // Melakukan proses rendering (pengisian) dokumen dengan data yang sudah diatur.
            doc.render();
        } catch (error) {
            // Menangkap dan melaporkan kesalahan spesifik yang terjadi selama proses rendering
            console.error("Error saat rendering dokumen:", error);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    message: 'Gagal mengisi dokumen. Periksa template atau data yang dikirim.',
                    error: error.message
                }),
            };
        }

        // Menghasilkan dokumen DOCX yang sudah terisi sebagai buffer (data biner).
        const buf = doc.getZip().generate({
            type: 'nodebuffer',   // Mengatur output sebagai Node.js Buffer
            compression: 'DEFLATE', // Menggunakan kompresi DEFLATE untuk mengurangi ukuran file
        });

        // --- Mengirim File DOCX Kembali ke Front-End ---
        // Ini adalah respons HTTP yang akan dikirim kembali ke browser.
        return {
            statusCode: 200, // Kode status 200 berarti sukses (OK)
            // Header 'Content-Type' sangat penting. Ini memberitahu browser bahwa responsnya adalah file DOCX.
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                // Header 'Content-Disposition' memberitahu browser untuk mengunduh file, dan memberikan nama default.
                'Content-Disposition': 'attachment; filename="Surat_Perintah_Tugas.docx"',
            },
            // Body respons adalah data biner dari file DOCX, yang harus dienkripsi Base64 untuk pengiriman HTTP.
            body: buf.toString('base64'),
            // Memberitahu Netlify bahwa 'body' sudah dienkode Base64. Ini sangat penting untuk file biner.
            isBase64Encoded: true,
        };

    } catch (error) {
        // Menangkap error umum yang mungkin terjadi di luar proses rendering
        console.error('Terjadi kesalahan umum di Netlify Function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Terjadi kesalahan internal pada server.',
                error: error.message
            }),
        };
    }
};