const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const { DOMParser } = require('xmldom'); // Ini adalah library XML parser yang benar
const path = require('path');
const fs = require('fs'); // Modul File System bawaan Node.js untuk membaca file

// Ini adalah fungsi utama yang akan dipanggil oleh Netlify setiap kali ada permintaan HTTP
exports.handler = async function(event, context) {
    // Memastikan bahwa hanya permintaan POST yang diterima oleh fungsi ini.
    // Formulir dari front-end akan mengirim data menggunakan metode POST.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Kode status 405 berarti 'Method Not Allowed'
            body: JSON.stringify({ message: 'Metode tidak diizinkan. Harap gunakan POST.' }),
        };
    }

    try {
        // Mengambil data yang dikirim dari formulir di front-end.
        // Data ini dikirim dalam format JSON string, jadi kita perlu mengubahnya menjadi objek JavaScript.
        const data = JSON.parse(event.body);

        // --- Bagian Membaca dan Mengisi Template DOCX ---

        // Menentukan lokasi file template DOCX Anda.
        // '__dirname' adalah direktori tempat file 'generate-document.js' ini berada.
        // Penting: 'template_spt.docx' harus berada di folder yang SAMA dengan 'generate-document.js'.
        const templatePath = path.resolve(__dirname, 'template_spt.docx');

        // Membaca isi file template DOCX secara biner.
        // 'binary' diperlukan karena file DOCX adalah data biner (bukan teks biasa).
        const content = fs.readFileSync(templatePath, 'binary');

        // Menginisialisasi PizZip untuk membuka dan memanipulasi file DOCX.
        // DOCX adalah format file yang sebenarnya merupakan arsip ZIP berisi file XML.
        const zip = new PizZip(content);

        // Menginisialisasi Docxtemplater. Ini adalah library yang akan mengisi placeholder di template.
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true, // Opsi untuk memungkinkan pengulangan paragraf (jika ada daftar)
            linebreaks: true,    // Opsi untuk menangani baris baru di teks placeholder
            parser: (tag) => {   // Mengatur bagaimana Docxtemplater mengenali placeholder (misalnya, {namaPegawai})
                return {
                    get(scope) {
                        return scope[tag]; // Mengambil nilai dari objek 'data' berdasarkan nama placeholder
                    }
                };
            }
        });

        // Mengisi data ke dalam template DOCX.
        // Kunci (keys) di sini (misalnya 'namaPegawai', 'nip') harus SAMA PERSIS
        // dengan nama placeholder yang Anda tulis di file 'template_spt.docx' Anda (misalnya {namaPegawai}, {nip}).
        doc.setData({
            namaPegawai: data.namaPegawai || '[Nama Pegawai Kosong]', // Jika data dari formulir tidak ada, gunakan nilai default ini
            nip: data.nip || '[NIP Kosong]',
            jabatan: data.jabatan || '[Jabatan Kosong]',
            tujuan: data.tujuan || '[Tujuan Kosong]',
            tanggalBerangkat: data.tanggalBerangkat || '[Tanggal Berangkat Kosong]',
            tanggalKembali: data.tanggalKembali || '[Tanggal Kembali Kosong]',
            // Anda bisa menambahkan placeholder lain di sini sesuai kebutuhan template SPT Anda, contoh:
            // tanggalSekarang: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
            // nomorSurat: '001/SPT/' + new Date().getFullYear(),
        });

        try {
            // Melakukan proses rendering (pengisian) dokumen dengan data yang sudah diatur.
            doc.render();
        } catch (error) {
            // Menangkap dan melaporkan kesalahan spesifik yang terjadi selama proses rendering (misalnya, template rusak).
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
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            // Header 'Content-Disposition' memberitahu browser untuk mengunduh file, dan memberikan nama default.
            'Content-Disposition': 'attachment; filename="Surat_Perintah_Tugas.docx"',
            // Body respons adalah data biner dari file DOCX, yang harus dienkripsi Base64 untuk pengiriman HTTP.
            body: buf.toString('base64'),
            // Memberitahu Netlify bahwa 'body' sudah dienkode Base64. Ini sangat penting untuk file biner.
            isBase64Encoded: true,
        };

    } catch (error) {
        // Menangkap error umum yang mungkin terjadi di luar proses rendering
        // (misalnya, data JSON tidak valid, file template tidak ditemukan, masalah hak akses).
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