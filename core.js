/**
 * TorrentBD Magnetter Core Logic
 */

// ==========================================
// TorrentBD Logic
// ==========================================
async function runTorrentBD() {

    // Helper to get user trackers
    async function getTrackers() {
        try {
            const data = await browser.storage.local.get("trackers");
            return data.trackers || [];
        } catch (e) {
            return [];
        }
    }

    const dlBtn = document.querySelector('#dl-btn') || document.querySelector('a.btn.waves-effect.inline.tgaction');
    if (!dlBtn) {
        console.log("TorrentBD Magnetter: No download button found");
        return;
    }

    // Check if already injected
    if (dlBtn.closest('.torrtopbtn-wrapper') && dlBtn.closest('.torrtopbtn-wrapper').parentNode.querySelector('.magnet-btn')) return;
    if (dlBtn.parentNode.querySelector('.magnet-btn')) return;

    // Create the button (Initial state)
    const magnetBtn = document.createElement('a');
    magnetBtn.className = 'btn waves-effect inline tgaction magnet-btn';
    magnetBtn.innerHTML = '<i class="material-icons left">link</i> Magnet';
    magnetBtn.href = '#';

    // Create wrapper to match site structure
    const wrapper = document.createElement('div');
    wrapper.className = 'torrtopbtn-wrapper';
    wrapper.appendChild(magnetBtn);
    
    // Insert after the download button's wrapper
    const dlWrapper = dlBtn.closest('.torrtopbtn-wrapper') || dlBtn.parentNode;
    dlWrapper.parentNode.insertBefore(wrapper, dlWrapper.nextSibling);

    let isProcessing = false;

    magnetBtn.addEventListener('click', async (e) => {
        // If we already have a magnet link (href is set to magnet:...), let it proceed naturally
        if (magnetBtn.href.startsWith('magnet:')) {
            return;
        }

        e.preventDefault();
        if (isProcessing) {
            return;
        }

        isProcessing = true;
        // const originalContent = magnetBtn.innerHTML;
        magnetBtn.innerHTML = '<i class="material-icons left">hourglass_empty</i> Loading...';
        magnetBtn.style.cursor = 'wait';

        try {
            const response = await fetch(dlBtn.href);
            if (!response.ok) throw new Error("Network response was not ok: " + response.statusText);
            
            const arrayBuffer = await response.arrayBuffer();
            
            if (!window.TorrentConverter) {
                throw new Error("TorrentConverter library not loaded");
            }

            // Get User Trackers FIRST
            const userTrackers = await getTrackers();
            
            // Pass them to the converter (it will use them INSTEAD of internal ones if present)
            let magnetLink = await window.TorrentConverter.toMagnet(arrayBuffer, userTrackers);
            
            if (magnetLink) {
                
                // Update button to be a valid link now
                magnetBtn.href = magnetLink;
                magnetBtn.innerHTML = '<i class="material-icons left">link</i> Magnet';
                magnetBtn.style.cursor = 'pointer';
                
                // Trigger navigation
                window.location.href = magnetLink;
                
            } else {
                throw new Error("Magnet conversion failed");
            }
        } catch (e) {
            console.error("TorrentBD Magnetter Error:", e);
            magnetBtn.innerHTML = '<i class="material-icons left">error</i> Error';
            magnetBtn.style.backgroundColor = '#555'; // Dark grey for error
            magnetBtn.title = e.message;
        } finally {
            isProcessing = false;
        }
    });

}

// Start
runTorrentBD();