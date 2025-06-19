document.addEventListener('DOMContentLoaded', function() {
    // --- Bagian Jam & Tanggal ---
    function updateDateTime() {
        const now = new Date();
        // Mengambil tanggal dengan format DD/MM/YYYY
        const formattedDate = now.toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\//g, '/');
        // Mengambil waktu dengan format HH:MM
        const formattedTime = now.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'});
        document.getElementById('datetime').textContent = `${formattedTime} ${formattedDate}`;
    }
    setInterval(updateDateTime, 1000); // Perbarui setiap detik
    updateDateTime(); // Panggil sekali saat halaman dimuat

    // --- Bagian Sidebar Toggle ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mainContainer = document.querySelector('.main-container');

    // Logic untuk menyembunyikan sidebar di layar kecil secara default
    if (window.innerWidth <= 768) {
        sidebar.classList.add('hidden');
        mainContainer.style.marginLeft = '0'; // Konten tidak terpengaruh jika sidebar tersembunyi
    } else {
        sidebar.classList.remove('hidden');
        mainContainer.style.marginLeft = '250px'; // Set margin awal untuk desktop
    }

    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('hidden');
        // Hanya sesuaikan margin konten jika bukan layar mobile (lebar > 768px)
        if (window.innerWidth > 768) {
            if (sidebar.classList.contains('hidden')) {
                mainContainer.style.marginLeft = '60px'; // Lebar sidebar yang disembunyikan
            } else {
                mainContainer.style.marginLeft = '250px'; // Lebar sidebar yang terbuka
            }
        }
    });

    // Responsivitas Sidebar saat ukuran jendela berubah
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('hidden'); // Selalu sembunyikan sidebar di mobile
            mainContainer.style.marginLeft = '0';
        } else {
            sidebar.classList.remove('hidden'); // Selalu tampilkan di desktop
            mainContainer.style.marginLeft = '250px';
        }
    });

    // --- Bagian Submenu ---
    const submenuItems = document.querySelectorAll('.has-submenu > .nav-item');
    submenuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); // Mencegah link default
            const parentLi = this.closest('.has-submenu');
            parentLi.classList.toggle('active'); // Mengaktifkan/menonaktifkan submenu

            // Tutup submenu lain jika ada yang terbuka
            submenuItems.forEach(otherItem => {
                const otherParentLi = otherItem.closest('.has-submenu');
                if (otherParentLi !== parentLi && otherParentLi.classList.contains('active')) {
                    otherParentLi.classList.remove('active');
                }
            });
        });
    });

    // --- Fungsionalitas Formulir Dinamis (PENTING!) ---
    const formContainer = document.getElementById('form-container');
    const submenuLinks = document.querySelectorAll('.submenu a');

    // Template HTML untuk formulir SPT
    const sptFormHtml = `
        <div class="placeholder-card">
            <h2>Formulir Surat Perintah Tugas (SPT)</h2>
            <form id="spt-form">
                <div class="form-group">
                    <label for="namaPegawai">Nama Pegawai:</label>
                    <input type="text" id="namaPegawai" name="namaPegawai" required>
                </div>
                <div class="form-group">
                    <label for="nip">NIP:</label>
                    <input type="text" id="nip" name="nip" required>
                </div>
                <div class="form-group">
                    <label for="jabatan">Jabatan:</label>
                    <input type="text" id="jabatan" name="jabatan" required>
                </div>
                <div class="form-group">
                    <label for="tujuan">Tujuan Perjalanan Dinas:</label>
                    <textarea id="tujuan" name="tujuan" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label for="tanggalBerangkat">Tanggal Berangkat:</label>
                    <input type="date" id="tanggalBerangkat" name="tanggalBerangkat" required>
                </div>
                <div class="form-group">
                    <label for="tanggalKembali">Tanggal Kembali:</label>
                    <input type="date" id="tanggalKembali" name="tanggalKembali" required>
                </div>
                <button type="submit" class="submit-button">Buat SPT</button>
            </form>
            <div id="response-message" style="margin-top: 15px; font-weight: bold;"></div>
        </div>
    `;

    // Template HTML untuk formulir SPPD (saat ini masih placeholder)
    const sppdFormHtml = `
        <div class="placeholder-card">
            <h2>Formulir Surat Perintah Perjalanan Dinas (SPPD)</h2>
            <p>Formulir SPPD akan datang di sini. Untuk saat ini, Anda bisa mencoba formulir SPT.</p>
        </div>
    `;

    // Loop melalui setiap link di submenu
    submenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const templateType = this.dataset.template; // Mengambil nilai dari atribut data-template (misal: 'spt')

            formContainer.innerHTML = ''; // Kosongkan kontainer formulir sebelumnya

            if (templateType === 'spt') {
                formContainer.innerHTML = sptFormHtml; // Masukkan HTML formulir SPT
                setupSptFormSubmission(); // Panggil fungsi untuk menangani submit form SPT
            } else if (templateType === 'sppd') {
                formContainer.innerHTML = sppdFormHtml; // Masukkan HTML formulir SPPD
            }
        });
    });

    // Fungsi untuk menangani proses pengiriman formulir SPT ke Netlify Function
    function setupSptFormSubmission() {
        const sptForm = document.getElementById('spt-form');
        const responseMessage = document.getElementById('response-message');

        if (sptForm) {
            sptForm.addEventListener('submit', async function(e) {
                e.preventDefault(); // Mencegah halaman reload saat submit

                const formData = new FormData(sptForm); // Mengambil data dari formulir
                const data = {};
                for (let [key, value] of formData.entries()) {
                    data[key] = value; // Mengubah FormData menjadi objek JavaScript biasa
                }

                responseMessage.textContent = 'Membuat dokumen... Mohon tunggu.';
                responseMessage.style.color = 'orange';

                try {
                    // KAMI AKAN PANGGIL NETLIFY FUNCTION DI SINI!
                    // '/.netlify/functions/generate-document' adalah path default untuk Netlify Function
                    const response = await fetch('/.netlify/functions/generate-document', {
                        method: 'POST', // Mengirim data menggunakan metode POST
                        headers: {
                            'Content-Type': 'application/json' // Memberitahu server bahwa kita mengirim JSON
                        },
                        body: JSON.stringify(data) // Mengubah objek data menjadi string JSON
                    });

                    if (!response.ok) { // Jika ada kesalahan HTTP (misal 404, 500)
                        const errorText = await response.text();
                        throw new Error(`HTTP error! Status: ${response.status}. Pesan: ${errorText}`);
                    }

                    // Mengambil respons dari Netlify Function sebagai Blob (binary data)
                    // Karena kita akan mengembalikan file DOCX langsung dari Function
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob); // Membuat URL sementara dari Blob

                    const a = document.createElement('a'); // Membuat elemen <a> untuk unduh
                    a.href = url;
                    a.download = 'Surat_Perintah_Tugas.docx'; // Nama file saat diunduh
                    document.body.appendChild(a); // Menambahkan <a> ke DOM (untuk bisa diklik)
                    a.click(); // Klik <a> secara otomatis untuk memulai unduhan
                    a.remove(); // Hapus <a> setelah unduhan dimulai
                    window.URL.revokeObjectURL(url); // Membebaskan URL sementara

                    responseMessage.textContent = 'Dokumen berhasil dibuat dan diunduh!';
                    responseMessage.style.color = 'green';

                } catch (error) {
                    console.error('Error saat membuat dokumen:', error);
                    responseMessage.textContent = `Terjadi kesalahan: ${error.message}. Cek konsol browser untuk detail.`;
                    responseMessage.style.color = 'red';
                }
            });
        }
    }
});