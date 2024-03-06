import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import firebaseConfig from './auth_firebase.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const storageRef = ref(storage, 'Record/');


const imagesPerPage = 50;
let currentPage = 1;
let totalImages =0;
let totalPages =0;

const totalPagesElement = document.getElementById('totalPages');
const currentPageElement = document.getElementById('currentPage');

const prevPageButton = document.getElementById('prevPage');
const nextPageButton = document.getElementById('nextPage');

const tbody = document.getElementById('tbody');
var img_i=1;
// convert time to human-readable format YYYY/MM/DD HH:MM:SS
function epochToDateTime(epochTime){
  var epochDate = new Date(epochToJsDate(epochTime));
  var dateTime = epochDate.getFullYear() + "/" +
    ("00" + (epochDate.getMonth() + 1)).slice(-2) + "/" +
    ("00" + epochDate.getDate()).slice(-2) + " " +
    ("00" + epochDate.getHours()).slice(-2) + ":" +
    ("00" + epochDate.getMinutes()).slice(-2) + ":" +
    ("00" + epochDate.getSeconds()).slice(-2);

  return dateTime;
}
function epochToJsDate(epochTime){
  return new Date(epochTime*1000);
}
function displayImages(startIndex, endIndex) {
  startIndex = (currentPage-1 ) * imagesPerPage;
  endIndex = startIndex + imagesPerPage;

  tbody.innerHTML = ''; // Clear previous images

  // Get all the images from the storage
  listAll(storageRef).then(function(result) {
    totalImages = result.items.length;
    totalPages = Math.ceil(totalImages / imagesPerPage);
    var fileNameA
    var fileNameB
    totalPagesElement.textContent = totalPages;
    currentPageElement.textContent = currentPage;

    result.items.sort((a, b) => {
      // Extract the file names from the full paths
      fileNameA = epochToDateTime(a.name.split('/').pop());
      fileNameB = epochToDateTime(b.name.split('/').pop());
      // Compare file names and return the result
      return fileNameB.localeCompare(fileNameA);
    }).slice(startIndex, endIndex).forEach(function(imageRef=fileNameB, index) {
      // Get the download URL for each image
      getDownloadURL(imageRef).then(function(url) {
        //console.log(imageRef);
        // Create a new table row
        const row = document.createElement('tr');
        // Create table data for image number
        const numberCell = document.createElement('td');
        numberCell.textContent = img_i; // Display image number
        img_i++;
        row.appendChild(numberCell);
        // Create table data for image name
        const nameCell = document.createElement('td');
        nameCell.textContent = epochToDateTime(imageRef.name);
        row.appendChild(nameCell);

        // Create table data for image
        const imageCell = document.createElement('td');
        const img = document.createElement('img');
        img.src = url;
        img.style.width = '300px'; // Set the width of the image (adjust as needed)
        img.style.height = 'auto'; // Set the height of the image (adjust as needed)
        img.style.paddingLeft = '32%'; // Set the position
        imageCell.appendChild(img);
        row.appendChild(imageCell);

        // Append the new row to the table body
        tbody.appendChild(row);
      }).catch(function(error) {
        console.error('Error getting download URL:', error);
      });
    });
    
  }).catch(function(error) {  
    console.error('Error listing images:', error);
  });
}
prevPageButton.addEventListener('click', function() {
  if (currentPage > 1) {
    currentPage--;
    displayImages();
  }
});

nextPageButton.addEventListener('click', function() {
  if (currentPage < totalPages) {
    currentPage++;
    displayImages();
  }
});
mainbtn.addEventListener('click', function() {
    window.location.href = 'main.html';
});
window.onload = function() {
  displayImages();
};

const DownloadButtonElement = document.getElementById('download-button');
DownloadButtonElement.addEventListener('click', (e) => {
  let timerInterval;
  Swal.fire({
    title: "คุณจะทำดาวน์โหลดหรือไม่?",
    icon: "warning",
    showCancelButton: true,
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes",
    cancelButtonText: "No",
    showClass: {
      popup: `
        animate__animated
        animate__fadeInUp
        animate__faster
      `
    },
    hideClass: {
      popup: `
        animate__animated
        animate__fadeOutDown
        animate__faster
      `
    }
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        title: "กำลังจัดเตรียมไฟล์",
        html: "โปรดรอสักครู่!!!",
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
          const timer = Swal.getPopup().querySelector("b");
          timerInterval = setInterval(() => {
            timer.textContent = `${Swal.getTimerLeft()}`;
          }, 100);
        },
        willClose: () => {
          clearInterval(timerInterval);
        }
      }).then(() => {
        Swal.fire("Download!", "", "success");
        // บันทึกข้อมูลลงใน Realtime database
        console.log("downloadButtonElement")
        exportToCSV()
      });
    }
  });
});



function exportToCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  const tableHeaderCells = document.querySelectorAll('#theader th');
  tableHeaderCells.forEach(function (header) {
    csvContent += header.textContent + ",";
  });
  csvContent += "\n";
  const tableRows = document.querySelectorAll('#tbody tr');
  tableRows.forEach(function (row) {
    const tableCells = row.querySelectorAll('td');
    tableCells.forEach(function (cell) {
      csvContent += cell.textContent;
      const imgSrc = cell.querySelector('img')?.src || ''; // Get img src or empty string if img element does not exist
      csvContent += imgSrc + ",";
      console.log(imgSrc);
    });
    csvContent += "\n";
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'log_img.csv');
  document.body.appendChild(link); // Required for Firefox
  link.click();
}