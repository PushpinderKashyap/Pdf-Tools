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

// Open/Close Merge PDF Modal
function openPopup() {
  document.getElementById("pdfModal").style.display = "flex";
}
function closePopup() {
  document.getElementById("pdfModal").style.display = "none";
}

// Merge PDFs Logic
async function mergePDFs() {
  const input = document.getElementById("pdfFiles");
  const files = input.files;
  if (files.length < 2) {
    return alert("Please select at least 2 PDF files to merge.");
  }

  const mergedPdf = await PDFLib.PDFDocument.create();

  for (let file of files) {
    if(file.type === "application/pdf"){
    const bytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(bytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    else{
       return alert("You can upload only pdfs");
    }
  }

  const mergedPdfBytes = await mergedPdf.save();
  const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "merged.pdf";
  a.click();
}

// Open/Close Convert Files Modal
function openConvertPopup() {
  document.getElementById("convertModal").style.display = "flex";
}
function closeConvertPopup() {
  document.getElementById("convertModal").style.display = "none";
}

function openCompressPopup() {
  document.getElementById("compressModal").style.display = "flex";
}
function closeCompressPopup() {
  document.getElementById("compressModal").style.display = "none";
}

// Convert Images + Text to PDF
async function handleConvertToPDF() {
  const input = document.getElementById("convertFiles");
  const files = Array.from(input.files);
  if (files.length === 0) return alert("Please upload files first.");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  for (let i = 0; i < files.length; i++) {

    const file = files[i];
    const type = file.type;

  // if(type === "application/pdf" || type === "image/jpg" || type === "image/jpeg" || type === "image/png" || type==="text/plain")
  // {
      if (type.startsWith("image/")) {
      const base64 = await fileToBase64(file);
      const img = new Image();
      img.src = base64;

      await new Promise((resolve) => {
        img.onload = () => {
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          pdf.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight);
          if (i !== files.length - 1) pdf.addPage();
          resolve();
        };
      });
    } else if (type === "text/plain") {
      const text = await file.text();
      pdf.setFontSize(12);
      pdf.text(text, 10, 20);
      if (i !== files.length - 1) pdf.addPage();
    } else {
      alert("Unsupported file type: " + file.name);
    }
 // }
  }

  pdf.save("converted.pdf");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleCompressPDF1() {
  const fileInput = document.getElementById("compressFile");
  const file = fileInput.files[0];
  if (!file || file.type !== "application/pdf") {
    return alert("Please upload a valid PDF file.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

  const newPdf = await PDFLib.PDFDocument.create();
  const scaleFactor = 0.7; // reduce content size for compression

  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
    const { width, height } = copiedPage.getSize();
    copiedPage.scaleContent(scaleFactor, scaleFactor);
    newPdf.addPage(copiedPage);
  }

  const compressedPdfBytes = await newPdf.save();
  const blob = new Blob([compressedPdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "compressed.pdf";
  link.click();
}

async function handleCompressPDF() {
  const file = document.getElementById('compressFile').files[0];
  if (!file) return alert("Upload a PDF first.");

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    // Compress image by converting to JPEG and reducing quality
    const imgData = canvas.toDataURL("image/jpeg", 0.5); // 0.5 = 50% quality

    if (pageNum > 1) doc.addPage();
    doc.addImage(imgData, "JPEG", 0, 0, 210, 297); // A4 size
  }

  doc.save("compressed.pdf");
}
