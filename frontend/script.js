document.addEventListener('DOMContentLoaded', function() {
    // --- Bagian Jam & Tanggal (Tidak Berubah) ---
    function updateDateTime() {
        const now = new Date();
        const formattedDate = now.toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\//g, '/');
        const formattedTime = now.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'});
        document.getElementById('datetime').textContent = `${formattedTime} ${formattedDate}`;
    }
    setInterval(updateDateTime, 1000);
    updateDateTime();

    // --- Bagian Sidebar Toggle (Tidak Berubah) ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mainContainer = document.querySelector('.main-container');

    if (window.innerWidth <= 768) {
        sidebar.classList.add('hidden');
        mainContainer.style.marginLeft = '0';
    } else {
        sidebar.classList.remove('hidden');
    }

    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('hidden');
        if (window.innerWidth > 768) {
            if (sidebar.classList.contains('hidden')) {
                mainContainer.style.marginLeft = '60px';
            } else {
                mainContainer.style.marginLeft = '250px';
            }
        }
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('hidden');
            mainContainer.style.marginLeft = '0';
        } else {
            sidebar.classList.remove('hidden');
            mainContainer.style.marginLeft = '250px';
        }
    });

    // --- Bagian Submenu (Tidak Berubah) ---
    const submenuItems = document.querySelectorAll('.has-submenu > .nav-item');
    submenuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const parentLi = this.closest('.has-submenu');
            parentLi.classList.toggle('active');

            submenuItems.forEach(otherItem => {
                const otherParentLi = otherItem.closest('.has-submenu');
                if (otherParentLi !== parentLi && otherParentLi.classList.contains('active')) {
                    otherParentLi.classList.remove('active');
                }
            });
        });
    });

    // --- Fungsionalitas Formulir Dinamis (Diperbarui untuk Auto-fill dari database.json) ---
    const formContainer = document.getElementById('form-container');
    const submenuLinks = document.querySelectorAll('.submenu a');

    // Template formulir dasar untuk SPT (Dengan dropdown dan field display)
    const sptFormHtml = `
        <div class="placeholder-card">
            <h2>Formulir Surat Perintah Tugas (SPT)</h2>
            <form id="spt-form">
                <div class="form-group">
                    <label for="selectNamaPegawai">Pilih Nama Pegawai:</label>
                    <select id="selectNamaPegawai" required>
                        <option value="">-- Pilih Pegawai --</option>
                        </select>
                </div>
                <div class="form-group">
                    <label for="namaPegawaiDisplay">Nama Pegawai:</label>
                    <input type="text" id="namaPegawaiDisplay" name="namaPegawai" readonly required>
                </div>
                <div class="form-group">
                    <label for="pangkatGolonganDisplay">Pangkat / Golongan:</label>
                    <input type="text" id="pangkatGolonganDisplay" name="pangkatGolongan" readonly required>
                </div>
                <div class="form-group">
                    <label for="nipDisplay">NIP:</label>
                    <input type="text" id="nipDisplay" name="nip" readonly required>
                </div>
                <div class="form-group">
                    <label for="jabatanDisplay">Jabatan:</label>
                    <input type="text" id="jabatanDisplay" name="jabatan" readonly required>
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

    // Template formulir dasar untuk SPPD (bisa dikembangkan nanti)
    const sppdFormHtml = `
        <div class="placeholder-card">
            <h2>Formulir Surat Perintah Perjalanan Dinas (SPPD)</h2>
            <p>Formulir SPPD akan datang di sini. Untuk saat ini, Anda bisa melihat formulir SPT.</p>
        </div>
    `;

    // Fungsi untuk memuat data pegawai dari JSON dan mengatur auto-fill
    async function loadPegawaiDataAndSetupAutofill() {
        let pegawaiData = []; // Deklarasikan di sini agar bisa diakses di luar try-catch

        try {
            // Mengambil file JSON dari folder 'frontend'
            const response = await fetch('/database.json');
            pegawaiData = await response.json(); // Simpan data ke variabel pegawaiData

            const selectNamaPegawai = document.getElementById('selectNamaPegawai');
            const namaPegawaiDisplay = document.getElementById('namaPegawaiDisplay');
            const pangkatGolonganDisplay = document.getElementById('pangkatGolonganDisplay');
            const nipDisplay = document.getElementById('nipDisplay');
            const jabatanDisplay = document.getElementById('jabatanDisplay');

            // Isi dropdown dengan nama-nama pegawai
            pegawaiData.forEach(pegawai => {
                const option = document.createElement('option');
                option.value = pegawai.NIP; // Gunakan NIP sebagai nilai unik untuk setiap opsi
                option.textContent = pegawai.Nama;
                selectNamaPegawai.appendChild(option);
            });

            // Tambahkan event listener untuk auto-fill saat nama dipilih
            selectNamaPegawai.addEventListener('change', function() {
                const selectedNIP = this.value;
                // Temukan objek pegawai yang cocok berdasarkan NIP
                const selectedPegawai = pegawaiData.find(pegawai => pegawai.NIP === selectedNIP);

                if (selectedPegawai) {
                    // Isi field display dengan data yang ditemukan
                    namaPegawaiDisplay.value = selectedPegawai.Nama;
                    pangkatGolonganDisplay.value = selectedPegawai["Pangkat / Golongan"]; // Akses dengan string karena ada spasi
                    nipDisplay.value = selectedPegawai.NIP;
                    jabatanDisplay.value = selectedPegawai.Jabatan;
                } else {
                    // Kosongkan field jika "-- Pilih Pegawai --" atau NIP tidak ditemukan
                    namaPegawaiDisplay.value = '';
                    pangkatGolonganDisplay.value = '';
                    nipDisplay.value = '';
                    jabatanDisplay.value = '';
                }
            });

        } catch (error) {
            console.error('Gagal memuat data pegawai:', error);
            // Anda bisa menampilkan pesan error di UI jika perlu, misal:
            // formContainer.innerHTML = '<p style="color: red;">Gagal memuat data pegawai. Silakan coba lagi nanti.</p>';
        }
    }

    // Fungsi untuk menangani submit formulir SPT
    function setupSptFormSubmission() {
        // Pastikan loadPegawaiDataAndSetupAutofill dipanggil setelah form SPT dimuat
        loadPegawaiDataAndSetupAutofill();

        const sptForm = document.getElementById('spt-form');
        const responseMessage = document.getElementById('response-message');

        if (sptForm) {
            sptForm.addEventListener('submit', async function(e) {
                e.preventDefault(); // Mencegah halaman reload saat submit

                const formData = new FormData(sptForm);
                const data = {};
                // Mengambil nilai dari input tersembunyi/readonly yang sudah diisi oleh JavaScript
                data['namaPegawai'] = formData.get('namaPegawai');
                data['pangkatGolongan'] = formData.get('pangkatGolongan'); // Ambil dari input tersembunyi
                data['nip'] = formData.get('nip');
                data['jabatan'] = formData.get('jabatan');
                data['tujuan'] = formData.get('tujuan');
                data['tanggalBerangkat'] = formData.get('tanggalBerangkat');
                data['tanggalKembali'] = formData.get('tanggalKembali');

                responseMessage.textContent = 'Membuat dokumen... Mohon tunggu.';
                responseMessage.style.color = 'orange';

                try {
                    const response = await fetch('/.netlify/functions/generate-document', {
                        method: 'POST', // Mengirim data menggunakan metode POST
                        headers: {
                            'Content-Type': 'application/json' // Memberitahu server bahwa kita mengirim JSON
                        },
                        body: JSON.stringify(data) // Mengubah objek data menjadi string JSON
                    });

                    if (!response.ok) { // Jika ada kesalahan HTTP (misal 404, 500)
                        const errorBody = await response.json(); // Coba ambil JSON error
                        throw new Error(`HTTP error! Status: ${response.status}. Pesan: ${errorBody.message || JSON.stringify(errorBody)}`);
                    }

                    // Mengambil respons dari Netlify Function sebagai Blob (binary data)
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
                    responseMessage.textContent = `Terjadi kesalahan: ${error.message}`;
                    responseMessage.style.color = 'red';
                }
            });
        }
    }

    // Loop melalui setiap link di submenu
    submenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const templateType = this.dataset.template;

            formContainer.innerHTML = ''; // Kosongkan kontainer formulir sebelumnya

            if (templateType === 'spt') {
                formContainer.innerHTML = sptFormHtml; // Masukkan HTML formulir SPT
                setupSptFormSubmission(); // Panggil fungsi untuk menangani submit form SPT
            } else if (templateType === 'sppd') {
                formContainer.innerHTML = sppdFormHtml; // Masukkan HTML formulir SPPD
            }
        });
    });
});