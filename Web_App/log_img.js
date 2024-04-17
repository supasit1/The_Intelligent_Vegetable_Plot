import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import firebaseConfig from './auth_firebase.js';
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const storageRef = ref(storage, 'Record/');
const imagesPerPage = 30;
let currentPage = 1;
let totalImages =0;
let totalPages =0;
let nameimg = [];
const totalPagesElement = document.getElementById('totalPages');
const currentPageElement = document.getElementById('currentPage');
const prevPageButton = document.getElementById('prevPage');
const nextPageButton = document.getElementById('nextPage');
const tbody = document.getElementById('tbody');
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
function displayImages(pageNumber, imagesPerPage) {
  const startIndex = (pageNumber - 1) * imagesPerPage;
  const endIndex = startIndex + imagesPerPage;
  tbody.innerHTML = ''; // Clear previous images
  listAll(storageRef).then(function(result) {
      //console.log(result);
      // Retrieve all image items
      const items = result.items;
      //console.log(items);
      // Get download URL for each image and store them in an array
      const promises = items.map(imageRef => {
          return getDownloadURL(imageRef).then(url => {
              // Extract timestamp from imageRef name
              const timestamp = parseInt(imageRef.name.split('.')[0]);
              return { url, timestamp };
          });
      });
      // Resolve all promises to get the array of objects containing URL and timestamp
      Promise.all(promises).then(images => {
          // Sort images based on timestamp in ascending order
          images.sort((a, b) => a.timestamp - b.timestamp);
          // Slice images based on pagination
          const slicedImages = images.slice(startIndex, endIndex);
          // Create table rows and populate the table
          slicedImages.forEach((image, index) => {
              // Create table row
              const row = document.createElement('tr');
              // Add No.
              const cellNo = document.createElement('td');
              cellNo.textContent = startIndex + index + 1; // Adjust for pagination
              row.appendChild(cellNo);
              // Add ชื่อ
              const cellName = document.createElement('td');
              cellName.textContent = epochToDateTime(image.timestamp);
              row.appendChild(cellName);
              // Add รูปภาพ
              const imageCell = document.createElement('td');
              const img = document.createElement('img');
              img.src = image.url;
              img.style.width = '400px'; // Set the width of the image (adjust as needed)
              img.style.height = 'auto'; // Set the height of the image (adjust as needed)
              img.style.paddingLeft = '25%'; // Set the position
              imageCell.appendChild(img);
              row.appendChild(imageCell);
              // Append row to table body
              tbody.appendChild(row)
          });
          // Calculate total pages
          totalImages = images.length;
          //console.log(totalImages);
          totalPages = Math.ceil(totalImages / imagesPerPage);
          totalPagesElement.textContent = totalPages;
          currentPageElement.textContent = currentPage;
      }).catch(error => {
          console.error('Error fetching image URLs:', error);
      });
  }).catch(error => {
      console.error('Error listing images:', error);
  });
}
displayImages(currentPage, imagesPerPage);
prevPageButton.addEventListener('click', function() {
  //console.log(totalPages)
  if (currentPage > 1) {
      currentPage--;
      displayImages(currentPage, imagesPerPage);
  }
});

nextPageButton.addEventListener('click', function() {
  //console.log(totalPages)
  if (currentPage < totalPages) {
      currentPage++;
      displayImages(currentPage, imagesPerPage);
      //console.log(imagesPerPage)
  }
});
mainbtn.addEventListener('click', function() {
    window.location.href = 'main.html';
});
const DownloadButtonElement = document.getElementById('downloadcsv');
DownloadButtonElement.addEventListener('click', (e) => {
  let timerInterval;
  Swal.fire({
    title: "คุณจะทำการดาวน์โหลดหรือไม่?",
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
        timer: 1000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
          const timer = Swal.getPopup().querySelector("b");
          timerInterval = setInterval(() => {
            timer.textContent =`${Swal.getTimerLeft()}`;
          }, 10000);
        },
        willClose: () => {
          clearInterval(timerInterval);
        }
      }).then(() => {
        Swal.fire("Download!", "", "success");
        //console.log("downloadButtonElement")
        exportToCSV()
      });
    }
  });
});

function exportToCSV() {
  // Initialize an empty array to store image data
  let imageData = [];
  listAll(storageRef).then(function(result) {
      // Retrieve all image items
      const items = result.items;
      // Get download URL for each image and store them in an array
      const promises = items.map(imageRef => {
          return getDownloadURL(imageRef).then(url => {
              // Extract timestamp from imageRef name
              const timestamp = parseInt(imageRef.name.split('.')[0]);
              const name = imageRef.name;
              return { url, timestamp, name };
          });
      });

      // Resolve all promises to get the array of objects containing URL and timestamp
      Promise.all(promises).then(images => {
          // Sort images based on timestamp in ascending order
          images.sort((a, b) => a.timestamp - b.timestamp);
          images.forEach((image, index) => {
            //console.log(image.name);
            imageData.push({
              url: image.url,
              name: image.name,
              datetime: epochToDateTime(image.timestamp)
            });
  
            // Check if all images are processed
            if (imageData.length === result.items.length) {
              // Call function to generate CSV
              generateCSV(imageData);
            }
          });
      }).catch(error => {
          console.error('Error fetching image URLs:', error);
      });
  }).catch(error => {
      console.error('Error listing images:', error);
  });

}
function generateCSV(imageData) {
  // Define CSV content
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Image Name,Date Time,Image URL\n";
  // Iterate through each image data
  imageData.forEach(function(image) {
    // Concatenate image data into CSV format
    let row = `${image.name},${image.datetime},${image.url}\n`;
    csvContent += row;
  });
  //Create a virtual link element to trigger the CSV download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "log_img.csv");
  // Append the link to the body
  document.body.appendChild(link);
  // Trigger the click event to initiate the download
  link.click();
}



const downloadimg = document.getElementById('downloadimg');
downloadimg.addEventListener('click', function() {
  let timerInterval;
  Swal.fire({
    title: "คุณจะทำการดาวน์โหลดหรือไม่?",
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
            timer.textContent =`${Swal.getTimerLeft()}`;
          }, 10000);
        },
        willClose: () => {
          clearInterval(timerInterval);
        }
      }).then(() => {
        Swal.fire("Download!", "", "success");
        //console.log("downloadButtonElement")
        exportToZip()
      });
    }
  });
});
function exportToZip(){
  const zip = new JSZip();
  listAll(storageRef, '/')
  .then((result) => {
      const promises = result.items.map((item) => {
          return getDownloadURL(item).then((url) => {
            const timestamp = parseInt(item.name.split('.')[0]);
            const name = epochToDateTime(timestamp);
            nameimg.push((name.toString())+".jpg");
            return fetch(url).then((response) => response.blob());
          });
      });
      Promise.all(promises)
      .then((blobs) => {
          blobs.sort((a, b) => a.timestamp - b.timestamp);
          nameimg.sort();
          blobs.forEach((blob, index) => {
            zip.file(nameimg[index], blob);
          });
          return zip.generateAsync({ type: "blob",compression:'DEFLATE'});
      })
      .then((content) => {
          const a = document.createElement('a');
          a.style.display = 'none';
          document.body.appendChild(a);
          const fileName = 'Log_Img.zip';
          a.href = window.URL.createObjectURL(content);
          a.download = fileName;
          a.click();
          document.body.removeChild(a);
      })
      .catch((error) => {
          console.error("Error:", error);
      });
  })
  .catch((error) => {
      console.error("Error:", error);
  });
}