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

    // --- Fungsionalitas Formulir Dinamis (Diperbarui untuk Multiple Pegawai & Auto-fill) ---
    const formContainer = document.getElementById('form-container');
    const submenuLinks = document.querySelectorAll('.submenu a');

    // Template HTML untuk formulir Surat Tugas (SPT)
    const sptFormHtml = `
        <div class="placeholder-card">
            <h2>Formulir Surat Tugas</h2>
            <form id="spt-form">
                <div id="pegawai-input-container">
                    </div>
                <button type="button" id="add-pegawai-btn" class="submit-button" style="background-color: #28a745; margin-bottom: 15px;">Tambah Pegawai</button>

                <div class="form-group">
                    <label for="jenisPengawasan">Jenis Pengawasan:</label>
                    <input type="text" id="jenisPengawasan" name="jenispengawasan" required>
                </div>
                <div class="form-group">
                    <label for="opd">OPD yang Diawasi:</label>
                    <input type="text" id="opd" name="opd" required>
                </div>
                <div class="form-group">
                    <label for="tanggalMulai">Tanggal Mulai Berlaku Tugas:</label>
                    <input type="date" id="tanggalMulai" name="tanggalmulai" required>
                </div>
                <div class="form-group">
                    <label for="tanggalBerakhir">Tanggal Berakhir Tugas:</label>
                    <input type="date" id="tanggalBerakhir" name="tanggalberakhir" required>
                </div>
                <button type="submit" class="submit-button">Buat Surat Tugas</button>
            </form>
            <div id="response-message" style="margin-top: 15px; font-weight: bold;"></div>
        </div>
    `;

    // Template formulir dasar untuk SPPD (Tidak Berubah)
    const sppdFormHtml = `
        <div class="placeholder-card">
            <h2>Formulir Surat Perintah Perjalanan Dinas (SPPD)</h2>
            <p>Formulir SPPD akan datang di sini. Untuk saat ini, Anda bisa melihat formulir Surat Tugas.</p>
        </div>
    `;

    // Variabel global untuk menyimpan data pegawai yang dimuat dari database.json
    let masterPegawaiData = [];

    // Fungsi untuk menambahkan blok input pegawai baru ke formulir
    function addPegawaiInputBlock() {
        const container = document.getElementById('pegawai-input-container');
        // Gunakan jumlah elemen anak sebagai indeks untuk ID unik
        const blockIndex = container.children.length;

        const blockHtml = `
            <div class="pegawai-block" style="border: 1px solid #eee; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
                <h4>Pegawai #${blockIndex + 1}</h4>
                <div class="form-group">
                    <label for="selectNamaPegawai_${blockIndex}">Pilih Nama Pegawai:</label>
                    <select id="selectNamaPegawai_${blockIndex}" data-index="${blockIndex}" class="select-nama-pegawai" required>
                        <option value="">-- Pilih Pegawai --</option>
                        </select>
                </div>
                <div class="form-group">
                    <label for="namaPegawaiDisplay_${blockIndex}">Nama:</label>
                    <input type="text" id="namaPegawaiDisplay_${blockIndex}" name="namapegawai_${blockIndex}" readonly required>
                </div>
                <div class="form-group">
                    <label for="pangkatPegawaiDisplay_${blockIndex}">Pangkat / Golongan:</label>
                    <input type="text" id="pangkatPegawaiDisplay_${blockIndex}" name="pangkatpegawai_${blockIndex}" readonly required>
                </div>
                <div class="form-group">
                    <label for="nipPegawaiDisplay_${blockIndex}">NIP:</label>
                    <input type="text" id="nipPegawaiDisplay_${blockIndex}" name="nippegawai_${blockIndex}" readonly required>
                </div>
                <div class="form-group">
                    <label for="jabatanPegawaiDisplay_${blockIndex}">Jabatan:</label>
                    <input type="text" id="jabatanPegawaiDisplay_${blockIndex}" name="jabatanpegawai_${blockIndex}" readonly required>
                </div>
                ${blockIndex > 0 ? '<button type="button" class="remove-pegawai-btn" style="background-color: #dc3545;">Hapus Pegawai Ini</button>' : ''}
            </div>
        `;
        // Menambahkan blok HTML ke dalam container
        container.insertAdjacentHTML('beforeend', blockHtml);

        // Mengisi dropdown di blok baru dengan data master pegawai
        const newSelect = document.getElementById(`selectNamaPegawai_${blockIndex}`);
        masterPegawaiData.forEach(pegawai => {
            const option = document.createElement('option');
            option.value = pegawai.NIP; // Menggunakan NIP sebagai nilai unik untuk setiap opsi
            option.textContent = pegawai.Nama;
            newSelect.appendChild(option);
        });

        // Menambahkan event listener untuk auto-fill pada blok baru
        newSelect.addEventListener('change', function() {
            const selectedNIP = this.value;
            const selectedPegawai = masterPegawaiData.find(pegawai => pegawai.NIP === selectedNIP);
            const idx = this.dataset.index; // Mengambil indeks blok dari atribut data-index

            if (selectedPegawai) {
                // Mengisi field display dengan data yang ditemukan
                document.getElementById(`namaPegawaiDisplay_${idx}`).value = selectedPegawai.Nama;
                document.getElementById(`pangkatPegawaiDisplay_${idx}`).value = selectedPegawai["Pangkat / Golongan"]; // Akses dengan string karena ada spasi di nama kunci JSON
                document.getElementById(`nipPegawaiDisplay_${idx}`).value = selectedPegawai.NIP;
                document.getElementById(`jabatanPegawaiDisplay_${idx}`).value = selectedPegawai.Jabatan;
            } else {
                // Mengosongkan field jika "-- Pilih Pegawai --" atau NIP tidak ditemukan
                document.getElementById(`namaPegawaiDisplay_${idx}`).value = '';
                document.getElementById(`pangkatPegawaiDisplay_${idx}`).value = '';
                document.getElementById(`nipPegawaiDisplay_${idx}`).value = '';
                document.getElementById(`jabatanPegawaiDisplay_${idx}`).value = '';
            }
        });

        // Menambahkan event listener untuk tombol hapus (jika ada) pada blok baru
        const removeBtn = container.querySelector(`.pegawai-block:last-child .remove-pegawai-btn`);
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                this.closest('.pegawai-block').remove(); // Menghapus seluruh blok pegawai
            });
        }
    }

    // Fungsi untuk memuat data master pegawai dari database.json
    async function loadMasterPegawaiData() {
        try {
            const response = await fetch('/database.json'); // Mengambil file JSON dari folder 'frontend'
            masterPegawaiData = await response.json(); // Menyimpan data ke variabel global masterPegawaiData
        } catch (error) {
            console.error('Gagal memuat data pegawai master:', error);
            // Anda bisa menampilkan pesan error di UI jika data gagal dimuat
        }
    }

    // Fungsi untuk menangani submit formulir Surat Tugas (SPT)
    function setupSptFormSubmission() {
        // Panggil ini saat formulir SPT dimuat untuk pertama kali
        loadMasterPegawaiData().then(() => {
            addPegawaiInputBlock(); // Tambah satu blok pegawai secara default saat form SPT terbuka
            const addPegawaiBtn = document.getElementById('add-pegawai-btn');
            if (addPegawaiBtn) {
                addPegawaiBtn.addEventListener('click', () => addPegawaiInputBlock()); // Event untuk tombol "Tambah Pegawai"
            }
        });

        const sptForm = document.getElementById('spt-form');
        const responseMessage = document.getElementById('response-message');

        if (sptForm) {
            sptForm.addEventListener('submit', async function(e) {
                e.preventDefault(); // Mencegah halaman reload saat submit

                // Mengambil data untuk setiap pegawai yang ditambahkan secara dinamis
                const pegawaiBlocks = document.querySelectorAll('.pegawai-block');
                const daftarPegawai = []; // Array untuk menyimpan data setiap pegawai

                pegawaiBlocks.forEach((block, index) => {
                    const nama = block.querySelector(`[name="namapegawai_${index}"]`).value;
                    const pangkat = block.querySelector(`[name="pangkatpegawai_${index}"]`).value;
                    const nip = block.querySelector(`[name="nippegawai_${index}"]`).value;
                    const jabatan = block.querySelector(`[name="jabatanpegawai_${index}"]`).value;

                    if (nama && nip) { // Hanya tambahkan ke array jika Nama dan NIP terisi
                        daftarPegawai.push({
                            namapegawai: nama,
                            pangkatpegawai: pangkat,
                            nippegawai: nip,
                            jabatanpegawai: jabatan
                        });
                    }
                });

                // Validasi: pastikan setidaknya ada satu pegawai yang ditambahkan
                if (daftarPegawai.length === 0) {
                    responseMessage.textContent = 'Harap tambahkan setidaknya satu pegawai.';
                    responseMessage.style.color = 'red';
                    return;
                }

                const formData = new FormData(sptForm);
                const data = {
                    // Kirim array daftarPegawai ke backend
                    daftarPegawai: daftarPegawai,
                    jenispengawasan: formData.get('jenispengawasan'),
                    opd: formData.get('opd'),
                    tanggalmulai: formData.get('tanggalmulai'),
                    tanggalberakhir: formData.get('tanggalberakhir')
                };

                // Mendapatkan Bulan dan Tahun dari tanggalmulai untuk placeholder {bulan} dan {tahun}
                const tanggalMulai = new Date(formData.get('tanggalmulai'));
                const bulanOptions = { month: 'long' };
                const bulanNama = tanggalMulai.toLocaleDateString('id-ID', bulanOptions);
                const tahun = tanggalMulai.getFullYear();

                data['bulan'] = bulanNama;
                data['tahun'] = tahun.toString();

                responseMessage.textContent = 'Membuat dokumen... Mohon tunggu.';
                responseMessage.style.color = 'orange';

                try {
                    // Panggil Netlify Function Anda
                    const response = await fetch('/.netlify/functions/generate-document', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
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
                    a.download = 'Surat_Tugas.docx'; // Nama file saat diunduh
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

    // Loop melalui setiap link di submenu (Tidak Berubah)
    submenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const templateType = this.dataset.template;

            formContainer.innerHTML = '';

            if (templateType === 'spt') {
                formContainer.innerHTML = sptFormHtml;
                setupSptFormSubmission(); // Panggil fungsi untuk menangani submit form SPT
            } else if (templateType === 'sppd') {
                formContainer.innerHTML = sppdFormHtml;
            }
        });
    });
});