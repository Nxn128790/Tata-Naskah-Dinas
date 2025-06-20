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

    // --- Fungsionalitas Formulir Dinamis (Diperbarui untuk N-Orang Statis Kondisional) ---
    const formContainer = document.getElementById('form-container');
    const submenuLinks = document.querySelectorAll('.submenu a');

    // Maksimal jumlah pegawai yang didukung template (sesuaikan dengan template_spt.docx)
    const MAX_PEGAWAI = 10; 

    // Template HTML untuk formulir Surat Tugas (SPT)
    const sptFormHtml = `
        <div class="placeholder-card">
            <h2>Formulir Surat Tugas</h2>
            <form id="spt-form">
                <div id="pegawai-input-container">
                    <!-- Blok input pegawai akan di-generate di sini -->
                </div>
                <button type="button" id="toggle-pegawai-btn" class="submit-button" style="background-color: #007bff; margin-bottom: 15px;">Tambah Pegawai</button>
                
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
    // Array untuk melacak status display setiap blok pegawai
    let pegawaiBlockStatus = Array(MAX_PEGAWAI).fill(false); // false = hidden, true = shown
    pegawaiBlockStatus[0] = true; // Pegawai pertama selalu ditampilkan

    // Fungsi untuk membuat HTML blok input pegawai
    function createPegawaiBlockHtml(index) {
        return `
            <div class="pegawai-block" id="pegawai-block-${index}" style="border: 1px solid #eee; padding: 15px; margin-bottom: 15px; border-radius: 8px; ${index > 0 && !pegawaiBlockStatus[index] ? 'display: none;' : ''}">
                <h4>Pegawai #${index + 1}</h4>
                <div class="form-group">
                    <label for="selectNamaPegawai_${index}">Pilih Nama Pegawai:</label>
                    <select id="selectNamaPegawai_${index}" data-index="${index}" class="select-nama-pegawai" ${index === 0 ? 'required' : ''}>
                        <option value="">-- Pilih Pegawai --</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="namaPegawaiDisplay_${index}">Nama:</label>
                    <input type="text" id="namaPegawaiDisplay_${index}" name="namapegawai${index + 1}" readonly ${index === 0 ? 'required' : ''}>
                </div>
                <div class="form-group">
                    <label for="pangkatPegawaiDisplay_${index}">Pangkat / Golongan:</label>
                    <input type="text" id="pangkatPegawaiDisplay_${index}" name="pangkatpegawai${index + 1}" readonly ${index === 0 ? 'required' : ''}>
                </div>
                <div class="form-group">
                    <label for="nipPegawaiDisplay_${index}">NIP:</label>
                    <input type="text" id="nipPegawaiDisplay_${index}" name="nippegawai${index + 1}" readonly ${index === 0 ? 'required' : ''}>
                </div>
                <div class="form-group">
                    <label for="jabatanPegawaiDisplay_${index}">Jabatan:</label>
                    <input type="text" id="jabatanPegawaiDisplay_${index}" name="jabatanpegawai${index + 1}" readonly ${index === 0 ? 'required' : ''}>
                </div>
                ${index > 0 ? `<button type="button" class="remove-pegawai-btn" data-index="${index}" style="background-color: #dc3545;">Hapus Pegawai #${index + 1}</button>` : ''}
            </div>
        `;
    }

    // Fungsi untuk mengisi dropdown dan mengatur auto-fill untuk blok pegawai tertentu
    function setupPegawaiBlockAutofill(blockIndex) {
        const selectNamaPegawai = document.getElementById(`selectNamaPegawai_${blockIndex}`);
        const namaPegawaiDisplay = document.getElementById(`namaPegawaiDisplay_${blockIndex}`);
        const pangkatPegawaiDisplay = document.getElementById(`pangkatPegawaiDisplay_${blockIndex}`);
        const nipPegawaiDisplay = document.getElementById(`nipPegawaiDisplay_${blockIndex}`);
        const jabatanPegawaiDisplay = document.getElementById(`jabatanPegawaiDisplay_${blockIndex}`);
        
        // Atur status required berdasarkan apakah blok ditampilkan
        const isBlockVisible = pegawaiBlockStatus[blockIndex];
        selectNamaPegawai.required = isBlockVisible; // Dropdown juga harus required
        namaPegawaiDisplay.required = isBlockVisible;
        pangkatPegawaiDisplay.required = isBlockVisible;
        nipPegawaiDisplay.required = isBlockVisible;
        jabatanPegawaiDisplay.required = isBlockVisible;

        // Isi dropdown dengan data master pegawai
        selectNamaPegawai.innerHTML = '<option value="">-- Pilih Pegawai --</option>'; // Reset
        masterPegawaiData.forEach(pegawai => {
            const option = document.createElement('option');
            option.value = pegawai.NIP;
            option.textContent = pegawai.Nama;
            selectNamaPegawai.appendChild(option);
        });

        // Event listener untuk auto-fill
        selectNamaPegawai.addEventListener('change', function() {
            const selectedNIP = this.value;
            const selectedPegawai = masterPegawaiData.find(pegawai => pegawai.NIP === selectedNIP);

            if (selectedPegawai) {
                namaPegawaiDisplay.value = selectedPegawai.Nama;
                pangkatPegawaiDisplay.value = selectedPegawai["Pangkat / Golongan"];
                nipPegawaiDisplay.value = selectedPegawai.NIP;
                jabatanPegawaiDisplay.value = selectedPegawai.Jabatan;
            } else {
                namaPegawaiDisplay.value = '';
                pangkatPegawaiDisplay.value = '';
                nipPegawaiDisplay.value = '';
                jabatanPegawaiDisplay.value = '';
            }
            // Update required state based on selection for currently visible block
            selectNamaPegawai.required = selectedNIP !== ''; // Required jika ada pilihan
            namaPegawaiDisplay.required = selectedNIP !== '';
            pangkatPegawaiDisplay.required = selectedNIP !== '';
            nipPegawaiDisplay.required = selectedNIP !== '';
            jabatanPegawaiDisplay.required = selectedNIP !== '';
        });
    }

    // Fungsi untuk memuat data master pegawai dari database.json
    async function loadMasterPegawaiData() {
        try {
            const response = await fetch('/database.json');
            masterPegawaiData = await response.json();
            
            // Generate semua blok pegawai (awalnya sebagian disembunyikan)
            const pegawaiInputContainer = document.getElementById('pegawai-input-container');
            for (let i = 0; i < MAX_PEGAWAI; i++) {
                pegawaiInputContainer.insertAdjacentHTML('beforeend', createPegawaiBlockHtml(i));
                setupPegawaiBlockAutofill(i); // Setup autofill untuk semua blok
            }

            // Atur event listener untuk tombol show/hide
            const togglePegawaiBtn = document.getElementById('toggle-pegawai-btn');
            if (togglePegawaiBtn) {
                togglePegawaiBtn.addEventListener('click', () => {
                    let nextHiddenIndex = -1;
                    // Cari blok pegawai tersembunyi berikutnya untuk ditampilkan
                    for (let i = 1; i < MAX_PEGAWAI; i++) { // Mulai dari index 1 (pegawai kedua)
                        if (!pegawaiBlockStatus[i]) {
                            nextHiddenIndex = i;
                            break;
                        }
                    }

                    if (nextHiddenIndex !== -1) { // Ada blok yang bisa ditampilkan
                        const blockToShow = document.getElementById(`pegawai-block-${nextHiddenIndex}`);
                        blockToShow.style.display = 'block';
                        pegawaiBlockStatus[nextHiddenIndex] = true;
                        setupPegawaiBlockAutofill(nextHiddenIndex); // Reset required state and dropdown

                        // Update teks tombol
                        if (nextHiddenIndex + 1 < MAX_PEGAWAI) {
                            togglePegawaiBtn.textContent = `Tambah Pegawai #${nextHiddenIndex + 2}`;
                        } else {
                            togglePegawaiBtn.style.display = 'none'; // Sembunyikan jika semua blok ditampilkan
                        }
                    } else {
                        // Jika tidak ada lagi blok tersembunyi yang bisa ditampilkan
                        togglePegawaiBtn.style.display = 'none';
                    }
                });
            }

            // Atur event listener untuk tombol hapus pada setiap blok (kecuali yang pertama)
            // Menggunakan event delegation untuk tombol hapus
            pegawaiInputContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('remove-pegawai-btn')) {
                    const blockIndexToRemove = parseInt(event.target.dataset.index);
                    const blockToRemove = document.getElementById(`pegawai-block-${blockIndexToRemove}`);
                    
                    blockToRemove.style.display = 'none';
                    pegawaiBlockStatus[blockIndexToRemove] = false;
                    
                    // Kosongkan dan non-aktifkan required untuk blok yang disembunyikan
                    const inputs = blockToRemove.querySelectorAll('input, select');
                    inputs.forEach(input => {
                        input.required = false;
                        input.value = '';
                    });
                    
                    // Update tombol toggle
                    togglePegawaiBtn.style.display = 'block'; // Pastikan tombol tambah muncul lagi
                    // Set teks tombol ke nomor pegawai pertama yang tersembunyi
                    let firstHiddenIndex = -1;
                    for(let i = 1; i < MAX_PEGAWAI; i++) {
                        if (!pegawaiBlockStatus[i]) {
                            firstHiddenIndex = i;
                            break;
                        }
                    }
                    if (firstHiddenIndex !== -1) {
                         togglePegawaiBtn.textContent = `Tambah Pegawai #${firstHiddenIndex + 1}`;
                    } else {
                        togglePegawaiBtn.style.display = 'none'; // Sembunyikan jika semua blok ditampilkan
                    }
                }
            });

        } catch (error) {
            console.error('Gagal memuat data pegawai master:', error);
        }
    }

    // Fungsi untuk menangani submit formulir Surat Tugas (SPT)
    function setupSptFormSubmission() {
        loadMasterPegawaiData(); // Muat data master pegawai

        const sptForm = document.getElementById('spt-form');
        const responseMessage = document.getElementById('response-message');

        if (sptForm) {
            sptForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const data = {};
                // Ambil data untuk setiap pegawai hingga MAX_PEGAWAI
                for (let i = 0; i < MAX_PEGAWAI; i++) {
                    const block = document.getElementById(`pegawai-block-${i}`);
                    // Pastikan blok ada dan visible (tidak display: none)
                    if (block && block.style.display !== 'none' && document.getElementById(`selectNamaPegawai_${i}`).value !== '') { 
                        data[`namapegawai${i + 1}`] = document.getElementById(`namaPegawaiDisplay_${i}`).value;
                        data[`pangkatpegawai${i + 1}`] = document.getElementById(`pangkatPegawaiDisplay_${i}`).value;
                        data[`nippegawai${i + 1}`] = document.getElementById(`nipPegawaiDisplay_${i}`).value;
                        data[`jabatanpegawai${i + 1}`] = document.getElementById(`jabatanPegawaiDisplay_${i}`).value;
                    } else {
                        // Jika blok tidak ditampilkan atau tidak ada pilihan, kirim string kosong
                        // Ini penting agar placeholder di dokumen tidak undefined dan barisnya bisa hilang (kondisional)
                        data[`namapegawai${i + 1}`] = '';
                        data[`pangkatpegawai${i + 1}`] = '';
                        data[`nippegawai${i + 1}`] = '';
                        data[`jabatanpegawai${i + 1}`] = '';
                    }
                }

                const formData = new FormData(sptForm);
                data['jenispengawasan'] = formData.get('jenispengawasan');
                data['opd'] = formData.get('opd');
                data['tanggalmulai'] = formData.get('tanggalmulai');
                data['tanggalberakhir'] = formData.get('tanggalberakhir');

                // Tanggal untuk {bulan} dan {tahun}
                const tanggalMulai = new Date(formData.get('tanggalmulai'));
                const bulanOptions = { month: 'long' };
                const bulanNama = tanggalMulai.toLocaleDateString('id-ID', bulanOptions);
                const tahun = tanggalMulai.getFullYear();

                data['bulan'] = bulanNama;
                data['tahun'] = tahun.toString();

                responseMessage.textContent = 'Membuat dokumen... Mohon tunggu.';
                responseMessage.style.color = 'orange';

                try {
                    const response = await fetch('/.netlify/functions/generate-document', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (!response.ok) {
                        const errorBody = await response.json();
                        throw new Error(`HTTP error! Status: ${response.status}. Pesan: ${errorBody.message || JSON.stringify(errorBody)}`);
                    }

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'Surat_Tugas.docx';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);

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
                setupSptFormSubmission();
            } else if (templateType === 'sppd') {
                formContainer.innerHTML = sppdFormHtml;
            }
        });
    });
});