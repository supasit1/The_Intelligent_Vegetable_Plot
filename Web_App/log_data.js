import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, remove,onChildAdded} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import firebaseConfig from './auth_firebase.js';
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

var dblogPath ='Log/';
var datalogref = ref(database, dblogPath);

// convert epochtime to JavaScripte Date object
function epochToJsDate(epochTime){
    return new Date(epochTime*1000);
}
  
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
// DOM elements
const viewDataButtonElement = document.getElementById('view-data-button');
const DownloadButtonElement = document.getElementById('download-button');
const DeleteButtonElement = document.getElementById('delete-button');
const tableContainerElement = document.getElementById('tbody');
tableContainerElement.style.display="none";
var onDataChange;
// TABLE
var lastReadingTimestamp; //saves last timestamp displayed on the table
// Function that creates the table with the first 100 readings
function createTable(){
    tableContainerElement.innerHTML = ''
    var firstRun = true;
    // Use ref() function to create a reference to the database path
    onDataChange = onChildAdded(datalogref, function(snapshot) {
        var jsonData = snapshot.val(); // Use val() to get the snapshot's value
        //console.log(jsonData);
        var content='';
        content += '<tr>';
        content += '<td>' + epochToDateTime(`${jsonData.Timestamp}`) + '</td>';
        content += '<td>' + `${jsonData.Temperature}` + '</td>';
        content += '<td>' + `${jsonData.Humidity}` + '</td>';
        content += '<td>' + `${jsonData.Lux}` + '</td>';
        content += '<td>' +  `${jsonData.Soilmoisture}` + '</td>';
        content += '</tr>';
        $('#tbody').prepend(content);
        // Save lastReadingTimestamp --> corresponds to the first timestamp on the returned snapshot data
        if (firstRun){
            lastReadingTimestamp = `${jsonData.Timestamp}`;
            firstRun=false;
            console.log(lastReadingTimestamp);
        }
    });
    setTimeout(5000);
}
viewDataButtonElement.addEventListener('click', (e) =>{
    // Toggle DOM elements
    console.log('Test');
    tableContainerElement.style.display="";
    createTable();
});

// สร้างฟังก์ชันสำหรับการสร้างไฟล์ CSV
function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    $('#theader th').each(function(index, header) {
        csvContent += $(header).text() + ",";
    });
    csvContent += "\n";
    $('#tbody tr').each(function(index, row) {
        $(row).find('td').each(function(index, cell) {
            csvContent += $(cell).text() + ",";
        });
        csvContent += "\n";
    });
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");;
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "log.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
}
function deleteData(){
    remove(datalogref)
    .then(() => {
      console.log('ลบข้อมูล log สำเร็จ');
    })
    .catch((error) => {
      console.error("เกิดข้อผิดพลาดในการลบข้อมูล log:", error);
    });
}
createTable();
// เพิ่มการฟังก์ชัน exportToCSV() และ exportToXLSX() เข้าไปใน event listener ของปุ่ม
DownloadButtonElement.addEventListener('click', (e) =>{
    console.log("downloadButtonElement")
    exportToCSV()
});

DeleteButtonElement.addEventListener('click', (e) =>{
    if (confirm("คุณแน่ใจหรือไม่ที่ต้องการจะลบ log")) {
        const userInput = prompt("กรุณาพิมพ์ 'Delete all Data' เพื่อยืนยันการลบข้อมูล:");
        if(userInput.trim() === "Delete all Data"){
            console.log("Delete all Data");
            deleteData();
            location.reload();
        }
    } 
    else {
        // ไม่ต้องดำเนินการใดๆ
    }
    
});

var maintbn = document.getElementById('maintbn');
maintbn.addEventListener('click', (e) =>{
    window.location.href = 'main.html';
});
