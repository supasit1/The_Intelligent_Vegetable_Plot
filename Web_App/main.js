import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set,get} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import firebaseConfig from './auth_firebase.js';
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
var themeToggle = document.getElementById('themeToggle');
// สร้าง Media Query สำหรับตรวจสอบโหมดโทนสี
var darkModeQuery = window.matchMedia('(prefers-color-scheme: light)');

// เรียกฟังก์ชันเมื่อมีการเปลี่ยนแปลงในโหมดโทนสี
function handleThemeChange(e) {
    if (e.matches) {
      // ถ้าโหมดสีเป็น Dark Mode
      //console.log('Dark Mode enabled');
      themeToggle.value = "dark";
      // ทำสิ่งที่คุณต้องการเมื่ออยู่ใน Dark Mode
    } else {
      // ถ้าโหมดสีเป็น Light Mode
      //console.log('Light Mode enabled');
      themeToggle.value = "light";
      // ทำสิ่งที่คุณต้องการเมื่ออยู่ใน Light Mode
    }
}

// ตรวจสอบค่าเริ่มต้นของโหมดโทนสีและตั้งค่าให้เป็น Light Mode
if (!darkModeQuery.matches) {
  // ถ้าไม่ใช่ Dark Mode
  //console.log('Starting in Light Mode');
  themeToggle.value = "dark"; // เรียกใช้ฟังก์ชันที่ตรวจสอบโหมดเพื่อตั้งค่าเป็น Light Mode
  handleThemeChange(darkModeQuery);
} 
else {
  //console.log('Starting in Dark Mode');
  // ถ้าเป็น Dark Mode
  themeToggle.value = "light";
  handleThemeChange(darkModeQuery); // เรียกใช้ฟังก์ชันที่ตรวจสอบโหมดเพื่อการจัดการตามเงื่อนไข
}

const FirstcheckRef = ref(database, 'users/Firstcheck/value');
get(FirstcheckRef).then((snapshot)=>{
  const firstcheckValue = snapshot.val();
  //console.log('firstcheckValue get= ',firstcheckValue);
  if (firstcheckValue === "0") {
    window.location.href = 'index.html';
  }
})

//get element
var image = document.getElementById("image");
var HumidityElement = document.getElementById("humidity");
var temperatureElement = document.getElementById("temperature");
var pumpButton = document.getElementById("pumpButton");
var lightButton = document.getElementById("lightButton");
var completeButton = document.getElementById("complete");
var vegetname = document.getElementById("vegetname");
var t1 = document.getElementById("t1");
var t2 = document.getElementById("t2");
var t1_hour = document.getElementById("t1_hour");
var t2_hour = document.getElementById("t2_hour");
var t1_minute = document.getElementById("t1_minute");
var t2_minute = document.getElementById("t2_minute"); 
var soiledit = document.getElementById("soiledit");
var luxedit = document.getElementById("luxedit");
var editbtn = document.getElementById("editbtn");
var savebtn = document.getElementById("savebtn");
var cancelbtn = document.getElementById("cancelbtn");
var logdatabtn = document.getElementById("logdatabtn");
var logimgbtn = document.getElementById("logimgbtn");
var lightstatus = document.getElementById("lightstatus");
var pumpstatus = document.getElementById("pumpstatus")

//set data
const dataRef = ref(database, "Data");
onValue(dataRef, (snapshot) => {
  const data = snapshot.val();
  HumidityElement.innerText = `${data.Humidity}`;
  temperatureElement.innerText = `${data.Temperature}`;
  lux.innerText = `${data.Lux}`;
  soilmoisture.innerText = `${data.Soilmoisture}`;
  image.src = `${data.Streaming}`;
  pumpstatus.innerText =`${data.Pumpstatus}`==="0" ?"System Off":"Pump working" ;
  lightstatus.innerText =`${data.Lightstatus}`==="0"?"System Off":"Light working";
});
//Set users
const usersRef = ref(database, "users");
onValue(usersRef, (snapshot) => {
  const data = snapshot.val();
  const paddedHour1 = pad(data.Time1.hour);
  const paddedMinute1 = pad(data.Time1.minute);
  const paddedHour2 = pad(data.Time2.hour);
  const paddedMinute2 = pad(data.Time2.minute);
  t1.innerHTML = `${paddedHour1}:${paddedMinute1}`;
  t2.innerHTML = `${paddedHour2}:${paddedMinute2}`;
  t1_hour.value = data.Time1.hour;
  t2_hour.value = data.Time2.hour;
  t1_minute.value = data.Time1.minute;
  t2_minute.value = data.Time2.minute;
  luxedit.value = data.LuxThreshold.value;
  soiledit.value = data.MoistureThreshold.value;
  vegetname.innerHTML = `<i class="fa-solid fa-seedling fa-flip" style="color: #63E6BE;"></i>${data.Vegetable.name}`;
  pumpButton.innerText = `${data.PumpStatus.value}` === "0" ? "Switch\nPump Off" : "Switch\nPump On";
  lightButton.innerText = `${data.LightStatus.value}` === "0" ? " Switch\nLight Off" : "Switch\nLight On";
  pumpButton.classList.remove(`${data.PumpStatus.value}` === "0" ? 'btn-green-500' : 'btn-red-500');
  pumpButton.classList.add(`${data.PumpStatus.value}` === "0" ? 'btn-red-500' : 'btn-green-500');
  lightButton.classList.remove(`${data.LightStatus.value}` === "0" ? 'btn-green-500' : 'btn-red-500');
  lightButton.classList.add(`${data.LightStatus.value}` === "0" ? 'btn-red-500' : 'btn-green-500');
});
//Pump
pumpButton.addEventListener("click", () => {
  PumpButtonClicked();
});

//Function------------------------
function pad(number) {
  return (number < 10 ? '0' : '') + number;
}

function PumpButtonClicked() {
  // Read the current value
  const currentValue = pumpButton.innerText;
  // Toggle the value
  const newValue = currentValue === "Switch\nPump On" ? "Switch\nPump Off" : "Switch\nPump On";
  // Update the button attribute
  pumpButton.setAttribute("data-value", newValue);
  // Update the button text
  pumpButton.innerText = newValue;
  // Update the value in the database
  set_pumpStatus(newValue);
}
function set_pumpStatus(newValue) {
  const PumpvalueToSet = newValue === "Switch\nPump On" ? "1" : "0";
  
  set(ref(database, 'users/PumpStatus'), {
    value: PumpvalueToSet
  })
    .then(() => {
      //console.log("Pump Status saved successfully!");
    })
    .catch((error) => {
      console.error("The write failed...", error);
    });
}
//Light
lightButton.addEventListener("click", () => {
  lightButtonClicked();
});

function lightButtonClicked() {
  // Read the current value
  const currentValue = lightButton.innerText;
  // Toggle the value
  const newValue = currentValue === "Switch\nLight On" ? "Switch\nLight Off" : "Switch\nLight On";
  // Update the button attribute
  lightButton.setAttribute("data-value", newValue);
  // Update the button text
  lightButton.innerText = newValue;
  // Update the value in the database
  set_lightStatus(newValue);
}
function set_lightStatus(newValue) {
  const LightvalueToSet = newValue === "Switch\nLight On" ? "1" : "0";
  set(ref(database, 'users/LightStatus'), {
    value: LightvalueToSet
  })
    .then(() => {
      //console.log("Light Status saved successfully!");
    })
    .catch((error) => {
      console.error("The write failed...", error);
    });
}
function SetToRDB(){
  set(ref(database, 'users/PumpStatus'), {value: "0"});
  set(ref(database, 'users/LightStatus'), { value: "0" });
  set(ref(database, 'users/Firstcheck/value'), "0");
  set(ref(database, 'Data/Firstcheck'), "0")
}
function cancelEdit(){
  document.getElementById("edit").style.display = "none";
}
function showEditInput() {
  document.getElementById("edit").style.display = "block";
}

function saveEdited() {
  const Time1Ref = ref(database, 'users/Time1');
  const Time2Ref = ref(database, 'users/Time2');
  const soileditRef = ref(database, 'users/MoistureThreshold/value');
  const luxeditRef = ref(database, 'users/LuxThreshold/value');
  // กำหนดค่าข้อมูลในโหนดที่ต้องการ
  const time1Data = {
    hour: parseInt(t1_hour.value, 10),
    minute: parseInt(t1_minute.value, 10)
  };
  const time2Data = {
    hour: parseInt(t2_hour.value, 10),
    minute: parseInt(t2_minute.value, 10)
  };
  const soilData = parseInt(soiledit.value, 10);
  const luxData = parseInt(luxedit.value,10)
  Swal.fire({
    title: "คุณจะทำการบันทึกค่าหรือไม่?",
    icon: "warning",
    showCancelButton: true,
    cancelButtonColor: "#d33",
    confirmButtonText: "Save",
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
        Swal.fire("Saved!", "", "success");
        // บันทึกข้อมูลลงใน Realtime database
        set(Time1Ref, time1Data);
        set(Time2Ref, time2Data);
        set(soileditRef,soilData);
        set(luxeditRef,luxData);
        // console.log(time1Data);
        // console.log(time2Data);
        // console.log(soilData);
        // console.log(luxData);
        document.getElementById("edit").style.display = "none";
    }});
}
//button
logdatabtn.addEventListener('click', (e) =>{
  window.location.href = 'log_data.html';
});
logimgbtn.addEventListener('click', (e) =>{
  window.location.href = 'log_img.html';
});
completeButton.addEventListener('click', (e) =>{
  Swal.fire({
    title: "คุณแน่ใจหรือไม่ที่ต้องการเสร็จสิ้นการปลูก",
    icon: "warning",
    showCancelButton: true,
    cancelButtonColor: "#d33",
    confirmButtonText: "Save",
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
            title: "คุณต้องการที่จะ Download Data ไหม",
            icon: "warning",
            showCancelButton: true,
            cancelButtonColor: "#d33",
            confirmButtonText: "Save",
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
            if(result.isConfirmed){
              window.location.href = 'log_data.html';
            }
            else{
              window.location.href = 'index.html';
            }
            SetToRDB();
          })
      }
  });
  
});


editbtn.addEventListener("click", (e)=>{
  showEditInput();
})

savebtn.addEventListener("click", (e)=>{
  saveEdited();
 
})
cancelbtn.addEventListener("click", (e)=>{
  cancelEdit();
})

t1_minute.onchange = function() {
  const usersRef = ref(database, "users");
  var minute = parseInt(this.value);
  if (minute > 59) {
    Swal.fire({
      title: "ชั่วโมงต้องไม่เกิน 60",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
    });
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      this.value = data.Time1.minute;
    });
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
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      this.value = data.Time1.minute;
    });
  }
};
t2_minute.onchange = function() {
  var minute = parseInt(this.value);
  const usersRef = ref(database, "users");
  if (minute > 59) {
    Swal.fire({
      title: "ชั่วโมงต้องไม่เกิน 60",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
    });
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        this.value = data.Time2.minute;
      });
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
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      this.value = data.Time2.minute;
    });
  }
};
t1_hour.onchange = function() {
  var hour = parseInt(this.value);
  const usersRef = ref(database, "users");
  if (hour > 23) {
    Swal.fire({
      title: "ชั่วโมงต้องไม่เกิน 23",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
    });
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      this.value = data.Time1.hour;
    });
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
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      this.value = data.Time1.hour;
    });
  }
};
t2_hour.onchange = function() {
  var hour = parseInt(this.value);
  const usersRef = ref(database, "users");
  if (hour > 23) {
    Swal.fire({
      title: "ชั่วโมงต้องไม่เกิน 23",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
    });
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      this.value = data.Time2.hour;
    });
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
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      this.value = data.Time2.hour;
    });
  }
};
soiledit.onchange = function() {
  const usersRef = ref(database, "users");
  var value ;
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    value = data.MoistureThreshold.value;
  });
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
    this.value = value
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
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      this.value = value;
    });
  }
};
luxedit.onchange = function() {
  const usersRef = ref(database, "users");
  var value ;
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    value = data.LuxThreshold.value;
  });
  if(this.value > 9999){
    Swal.fire({
      title: "กรุณาใส่ค่าไม่เกิน 9999 LUX",
      icon: "error",
      showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster"
      },
      hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster"
      }
    });
    this.value =  value;
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
    this.value =  value;
  }
};