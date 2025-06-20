// generate-document.js (Fungsi Uji Sederhana)
exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Metode tidak diizinkan. Harap gunakan POST.' }),
        };
    }

    try {
        // Ini akan mencatat event yang masuk ke log fungsi Netlify (jika lognya berfungsi)
        console.log("Fungsi generate-document dipanggil!");
        console.log("Data yang diterima:", JSON.parse(event.body));

        // Kirim respons sukses yang sangat sederhana
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json" // Kirim JSON biasa
            },
            body: JSON.stringify({ message: 'Fungsi berhasil dipanggil dan merespons! (Ini hanya uji coba)' })
        };

    } catch (error) {
        // Ini akan mencatat error jika ada masalah di awal eksekusi fungsi
        console.error("Error di fungsi uji sederhana:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Terjadi kesalahan di fungsi uji', error: error.message }),
        };
    }
};