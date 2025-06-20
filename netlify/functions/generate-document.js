const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const { DOMParser } = require('xmldom');
const path = require('path');
const fs = require('fs');

const TEMPLATE_FILE_NAME = 'template_spt.docx';
const TEMPLATE_PATH = path.resolve(__dirname, TEMPLATE_FILE_NAME);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Metode tidak diizinkan. Harap gunakan POST.' }),
        };
    }

    let content;
    try {
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
        const data = JSON.parse(event.body);

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            // Parser standar yang akan bekerja dengan placeholder nama tunggal dan tag kondisional (.{tag})
            parser: (tag) => {
                const parse = Docxtemplater.L.getParser(tag, {
                    // Konfigurasi default L.getParser, mungkin diperlukan untuk tag kondisional
                });
                return {
                    get: (scope) => {
                        // Jika tag adalah tag internal Docxtemplater, biarkan parser bawaan menanganinya
                        if (tag.startsWith('@')) { // Handles @@+1, @foo, etc.
                             return parse(scope);
                        }
                        // Untuk tag kondisional seperti .namapegawai2, kita perlu memastikan data valid
                        if (tag.startsWith('.')) {
                            const actualTag = tag.substring(1); // Remove the dot
                            return !!scope[actualTag]; // Return true if the data exists and is not empty/null/false
                        }
                        return scope[tag]; // Default: get value directly from scope
                    }
                };
            }
        });

        // ISI DATA KE TEMPLATE
        // Data diterima sebagai individual key untuk setiap pegawai
        const templateData = {
            jenispengawasan: data.jenispengawasan || '[Jenis Pengawasan Kosong]',
            opd: data.opd || '[OPD Kosong]',
            tanggalmulai: data.tanggalmulai || '[Tanggal Mulai Kosong]',
            tanggalberakhir: data.tanggalberakhir || '[Tanggal Berakhir Kosong]',
            bulan: data.bulan || '[Bulan Kosong]',
            tahun: data.tahun || '[Tahun Kosong]',
        };

        // Tambahkan data pegawai ke templateData
        for (let i = 1; i <= MAX_PEGAWAI; i++) {
            templateData[`namapegawai${i}`] = data[`namapegawai${i}`] || '';
            templateData[`pangkatpegawai${i}`] = data[`pangkatpegawai${i}`] || '';
            templateData[`nippegawai${i}`] = data[`nippegawai${i}`] || '';
            templateData[`jabatanpegawai${i}`] = data[`jabatanpegawai${i}`] || '';
        }

        doc.setData(templateData);

        try {
            doc.render();
        } catch (error) {
            console.error("Error saat rendering dokumen:", error);
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