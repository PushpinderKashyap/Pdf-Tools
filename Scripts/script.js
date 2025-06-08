document.addEventListener("DOMContentLoaded", function () {
  const pdfjsLibGlobal = pdfjsLib;
  const thumbContainer = document.getElementById("thumbnail-container");
  const popup = document.getElementById("popup");
  const popupCanvas = document.getElementById("popup-canvas");
  const popupCtx = popupCanvas.getContext("2d");
  const popupClose = document.getElementById("popup-close");
  const downloadoptions = document.getElementById("downloadoptions");
  

  let pdfDoc = null;
  let selectedPageNum = null;

  document.getElementById("pdf-upload").addEventListener("change", async function () {
    const file = this.files[0];
    if (!file) {
        thumbContainer.style.display = "none";
        downloadoptions.style.display = "none";
        return;
    }
    else{
         if (file.type === "application/pdf") {
      thumbContainer.style.display = "block";
      } else {
        thumbContainer.style.display = "none";
        downloadoptions.style.display = "none";
       return alert("Please upload PDF file");
      }
        
    }

    const reader = new FileReader();
    reader.onload = async function () {
      const typedArray = new Uint8Array(reader.result);
      pdfDoc = await pdfjsLibGlobal.getDocument({ data: typedArray }).promise;
      renderThumbnails();
      selectedPageNum = null;
    };
    reader.readAsArrayBuffer(file);
  });

  async function renderThumbnails() {
    thumbContainer.innerHTML = "";

    if(pdfDoc.numPages > 0){
         downloadoptions.style.display = "block";
    }
    else{
         downloadoptions.style.display = "none";
    }
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 0.3 });

      const canvas = document.createElement("canvas");
      canvas.className = "thumb";
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

      const wrapper = document.createElement("div");
      wrapper.className = "thumb-wrapper";
      wrapper.appendChild(canvas);

      
      const pageNumber = document.createElement("div");
      pageNumber.className = "Pagecount";
      pageNumber.innerHTML ='<p class=margineZero>'+i+'</p>'
      wrapper.appendChild(pageNumber);


      const tick = document.createElement("div");
      tick.className = "tick";
      tick.innerHTML = '<i class="fa fa-check-circle"></i>';
      wrapper.appendChild(tick);

      // Zoom icon
      const zoomIcon = document.createElement("div");
      zoomIcon.className = "zoom-icon";
      //zoomIcon.innerText = "🔍";
      zoomIcon.innerHTML ='<i class="fa fa-search-plus zoomiconcolor"></i>'
      zoomIcon.title = "Zoom this page";
      wrapper.appendChild(zoomIcon);

      // Zoom popup opens only on zoomIcon click
      zoomIcon.onclick = (e) => {
        e.stopPropagation(); // prevent selecting page
        showPopup(page);
      };

      // Select page on wrapper click (except zoomIcon)
      wrapper.onclick = () => {
         if (wrapper.classList.contains("selected"))
         {
           wrapper.classList.remove('selected');
           selectedPageNum = null;
         }
         else{
        document.querySelectorAll('.thumb-wrapper').forEach(el => el.classList.remove('selected'));
        wrapper.classList.add("selected");
        selectedPageNum = i;
         }
         
       // renderSelectedPage(i);
      };

      thumbContainer.appendChild(wrapper);
    }
  }

//   async function renderSelectedPage(pageNum) {
//     const page = await pdfDoc.getPage(pageNum);
//     const viewport = page.getViewport({ scale: 2 });

//     previewCanvas.style.display = "block";
//     previewCanvas.width = viewport.width;
//     previewCanvas.height = viewport.height;

//     await page.render({ canvasContext: previewCtx, viewport }).promise;
//   }

  function showPopup(page) {
    popup.style.display = "flex";
    const viewport = page.getViewport({ scale: 2.5 });
    popupCanvas.width = viewport.width;
    popupCanvas.height = viewport.height;

    page.render({ canvasContext: popupCtx, viewport });
  }

  popupClose.onclick = () => {
    popup.style.display = "none";
    popupCtx.clearRect(0, 0, popupCanvas.width, popupCanvas.height);
  };

 async function renderPageToCanvas(pageNum, scale = 2) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = viewport.width;
  tempCanvas.height = viewport.height;
  const tempCtx = tempCanvas.getContext("2d");

  await page.render({ canvasContext: tempCtx, viewport }).promise;
  return tempCanvas;
}

window.downloadAsPNG = async function () {
  if (!selectedPageNum) return alert("Please select a page.");
  const tempCanvas = await renderPageToCanvas(selectedPageNum);
  const imgData = tempCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imgData;
  link.download = `page-${selectedPageNum}.png`;
  link.click();
};

window.downloadAsJPG = async function () {
  if (!selectedPageNum) return alert("Please select a page.");
  const tempCanvas = await renderPageToCanvas(selectedPageNum);
  const imgData = tempCanvas.toDataURL("image/jpeg", 1.0);
  const link = document.createElement("a");
  link.href = imgData;
  link.download = `page-${selectedPageNum}.jpg`;
  link.click();
};

window.downloadAsPDF = async function () {
  if (!selectedPageNum) return alert("Please select a page.");
  const { jsPDF } = window.jspdf;
  const tempCanvas = await renderPageToCanvas(selectedPageNum);
  const imgData = tempCanvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: tempCanvas.width > tempCanvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [tempCanvas.width, tempCanvas.height],
  });
  pdf.addImage(imgData, "PNG", 0, 0, tempCanvas.width, tempCanvas.height);
  pdf.save(`page-${selectedPageNum}.pdf`);
};
});
