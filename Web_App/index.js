import firebaseConfig from './auth_firebase.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase,ref,set,get,onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getFirestore, getDoc, getDocs,collection,doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage,ref as storageRef, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const firestore  = getFirestore(app);
const FirstcheckRef = ref(database, 'users/Firstcheck/value');
const storage = getStorage(app);
const strRef = storageRef(storage,'Record/')
get(FirstcheckRef).then((snapshot)=>{
  const firstcheckValue = snapshot.val();
  console.log('firstcheckValue get= ',firstcheckValue);
  if (firstcheckValue === "1") {
    window.location.href = 'main.html';
  }
})
const selectElement = document.getElementById('veget');
const t1_hour = document.getElementById('t1_hour');
const t1_minute = document.getElementById('t1_minute');
const t2_hour = document.getElementById('t2_hour');
const t2_minute = document.getElementById('t2_minute');
const confirmButton = document.getElementById('confirm');
const description = document.getElementById('description');
const lux = document.getElementById('lux');
const soil = document.getElementById('soil');
var logdatabtn = document.getElementById('logdatabtn');
var logimgbtn = document.getElementById('logimgbtn');
var soi
var selectedValue = "";
selectElement.addEventListener('change', async (event) => {
  // รับค่าที่ถูกเลือกจาก select
  selectedValue = event.target.value;
  async function getPresetdata(){
    const vegetCol = collection(firestore, 'Preset');
    const vegetSnap = await getDocs(vegetCol);
    return vegetSnap.docs.map(doc => doc.id); // รีเทิร์นเฉพาะ Document ID
  }

  const presetdata = await getPresetdata(firestore);
  if (presetdata.includes(selectedValue)) {
    showdata(selectedValue);
  }
  return selectedValue;
});

var data
async function showdata(docId) {
  const docRef = doc(firestore, 'Preset', docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    data = docSnap.data();
    description.innerText = data.description;
    soil.value = data.soilmoisture;
    lux.value = data.lux
    t1_hour.value = data.time1_h;
    t1_minute.value = data.time1_m;
    t2_hour.value = data.time2_h;
    t2_minute.value = data.time2_m;
  } else {
    console.log('Document does not exist!');
  }
}

function SetToRDB(){
  const Time1Ref = ref(database, 'users/Time1');
  const Time2Ref = ref(database, 'users/Time2');
  const PumpstatusRef=ref(database, 'users/PumpStatus');
  const lightstatusRef=ref(database, 'users/LightStatus');
  const vegetnameRef = ref(database, 'users/Vegetable');
  const soilRef = ref(database, 'users/MoistureThreshold');
  const luxRef = ref(database, 'users/LuxThreshold');
  var vegetname;
  if(selectedValue=== "Sun"){
    vegetname ={name:"ต้นอ่อนทานตะวัน"}
    console.log("vegetname ",vegetname);
  }
  else if(selectedValue=== "coriander"){
    vegetname ={name:"ผักชี"}
    console.log("vegetname ",vegetname);
  }
  else if(selectedValue=== "lettuce"){
    vegetname ={name:"ผักกาดหอม"}
    console.log("vegetname ",vegetname);
  }
  else if(selectedValue=== "morningglory "){
    vegetname ={name:"ผักบุ้งจีน"}
    console.log("vegetname ",vegetname);
  }
  // กำหนดค่าข้อมูลในโหนดที่ต้องการ
  const time1Data = {
    hour: parseInt(t1_hour.value, 10),
    minute: parseInt(t1_minute.value, 10)
};
const time2Data = {
    hour: parseInt(t2_hour.value, 10),
    minute: parseInt(t2_minute.value, 10)
};
const lightstatus = {value:"1"};
const pumpstatus ={value:"1"};
const soilRDB = { value: parseInt(soil.value, 10) }; 
const luxRDB = { value: parseInt(lux.value, 10) }; 
set(soilRef,soilRDB);
set(luxRef,luxRDB);
set(vegetnameRef, vegetname);
set(PumpstatusRef, pumpstatus);
set(lightstatusRef, lightstatus);
set(Time1Ref, time1Data);
set(Time2Ref, time2Data);
set(FirstcheckRef, "1");
window.location.href = 'main.html';
// บันทึกข้อมูลลงใน Realtime database
}
soil.onchange = function() {
  if(this.value > 100){
    Swal.fire({
      title: "กรุณาใส่ค่าไม่เกิน 100 %",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
    });
    this.value = data.soilmoisture;
  }
  if(this.value===""){
    Swal.fire({
      title: "ห้ามใส่ค่าว่าง!",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
    });
    this.value = data.soilmoisture;
  }
};
lux.onchange = function() {
  if(this.value===""){
    Swal.fire({
      title: "ห้ามใส่ค่าว่าง!",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
  });
    this.value =  data.lux;
  }
};
t1_minute.onchange = function() {
  var minute = parseInt(this.value);
  if (minute > 59) {
    Swal.fire({
      title: "ชั่วโมงต้องไม่เกิน 60!",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      },
  });
      this.value =  data.time1_m; // เคลียร์ค่าที่ผู้ใช้ป้อน
  }
  if(this.value===""){
    Swal.fire({
      title: "ห้ามใส่ค่าว่าง!",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
  });
    this.value = data.time1_m;
  }
};
t2_minute.onchange = function() {
  var minute = parseInt(this.value);
  if (minute > 59) {
    Swal.fire({
      title: "ชั่วโมงต้องไม่เกิน 60!",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      },
  });
      this.value = data.time2_m; // เคลียร์ค่าที่ผู้ใช้ป้อน
  }
  if(this.value===""){
    Swal.fire({
      title: "ห้ามใส่ค่าว่าง!",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
  });
    this.value = data.time2_m;
  }
};
t1_hour.onchange = function() {
  var hour = parseInt(this.value);
  if (hour > 23) {
    Swal.fire({
      title: "ชั่วโมงต้องไม่เกิน 23!",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      },
  });
      this.value = data.time1_h; // เคลียร์ค่าที่ผู้ใช้ป้อน
  }
  if(this.value===""){
    Swal.fire({
      title: "ห้ามใส่ค่าว่าง!",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
  });
    this.value = data.time1_h;
  }
};
t2_hour.onchange = function() {
  var hour = parseInt(this.value);
  if (hour > 23) {
    Swal.fire({
      title: "ชั่วโมงต้องไม่เกิน 23!",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
  });
  this.value = data.time2_h; // เคลียร์ค่าที่ผู้ใช้ป้อน
  }
  if(this.value===""){
    Swal.fire({
      title: "ห้ามใส่ค่าว่าง!",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
  });
    this.value = data.time2_h;
  }
};
confirmButton.addEventListener('click', (e) =>{
  if(selectedValue === ""){
    Swal.fire({
      title: "กรุณาเลือกผักที่ต้องการปลูก!",
      icon: "info",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
  });
  }
  else {
    Swal.fire({
        title: "คุณแน่ใจหรือไม่ที่ต้องการยืนยันการปลูก?",
        icon: "warning",
        showCancelButton: true,
        cancelButtonColor: "#d33",
        confirmButtonText: "ยืนยัน",
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
            // ทำการบันทึกข้อมูล
            SetToRDB();
        } else {
            // ไม่ต้องดำเนินการใดๆ
        }
    });
  }
});

logdatabtn.addEventListener('click', (e) =>{
  // Retrieve data once
  var numberOfEntries
  const logRef = ref(database,'Log/');
  onValue(logRef,function(snapshot){
    // Get the number of children (log entries)
    var jsonData = snapshot.val();
    numberOfEntries = Object.keys(jsonData).length;
    console.log(`Number of log entries: ${numberOfEntries}`);
  });
  if(numberOfEntries <= 0){
    alert('ไม่มีข้อมูล');
  }
  else{
    window.location.href = 'log_data.html';
  }
});

logimgbtn.addEventListener('click', (e) =>{
  listAll(strRef).then(function(result) {
    if (result.items.length <= 0) {
      alert('ไม่มีข้อมูล');
    } else {
      window.location.href = 'log_img.html';
    }
  }).catch(function(error) {
    console.error('Error listing images:', error);
  });

});
