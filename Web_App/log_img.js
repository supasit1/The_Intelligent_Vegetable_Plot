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
function displayImages(startIndex, endIndex) {
  startIndex = (currentPage-1 ) * imagesPerPage;
  endIndex = startIndex + imagesPerPage;

  tbody.innerHTML = ''; // Clear previous images

  // Get all the images from the storage
  listAll(storageRef).then(function(result) {
    totalImages = result.items.length;
    totalPages = Math.ceil(totalImages / imagesPerPage);

    totalPagesElement.textContent = totalPages;
    currentPageElement.textContent = currentPage;
    console.log(totalPages);
    result.items.slice(startIndex, endIndex).forEach(function(imageRef, index) {
        
        // Get the download URL for each image
      getDownloadURL(imageRef).then(function(url) {
        // Create a new table row
        const row = document.createElement('tr');

        // Create table data for image number
        const numberCell = document.createElement('td');
        numberCell.textContent = img_i; // Display image number
        img_i++;
        row.appendChild(numberCell);

        // Create table data for image name
        const nameCell = document.createElement('td');
        nameCell.textContent = imageRef.name;
        row.appendChild(nameCell);

        // Create table data for image
        const imageCell = document.createElement('td');
        const img = document.createElement('img');
        img.src = url;
        img.style.width = '200px'; // Set the width of the image (adjust as needed)
        img.style.height = 'auto'; // Set the height of the image (adjust as needed)
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
