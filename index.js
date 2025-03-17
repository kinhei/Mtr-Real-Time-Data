var Stations = {}; // store the option list of each MTR line
var stnList = {}; //dictionary, store every station code and its name
//Build the option selection lists for each MTR line
fetch("./station_data.json")
  .then((response) => response.json())
  .then((lines) => {
    lines.forEach((line) => {
      let station_opt_list = "";
      let linename = Object.keys(line)[0];
      let linelist = Object.values(line)[0];

      for (const station in linelist) {
        station_opt_list += `<option class="${linename}" value="${station}">${linelist[station]["engName"]}</option>`;
        stnList[station] = linelist[station];
      }
      Stations[linename] = station_opt_list;
    });
  })
  .catch((err) => console.error("Error loading station data:", err));

//Install an event handler for changing the station list after selecting the MTR line
let currentClass = "AEL"; //assume Airport Express line initially
let line = document.getElementById("line");
line.addEventListener("change", (evt) => {
  if (Object.keys(Stations).length === 0) {
    console.error("Stations data not loaded yet.");
    return;
  }
  let select = line.value;
  if (select !== currentClass) {
    let station = document.querySelector("#station");
    station.innerHTML = Stations[select];
    currentClass = select;
  }
});

//Install an event handler for handling the "Get Train Data" button
let bttn = document.getElementById("bttn");
bttn.addEventListener("click", fRequest);

function fRequest() {
  let line = document.getElementById("line").value;
  let station = document.getElementById("station").value;
  fetch(
    `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${line}&sta=${station}`
  ).then((response) => {
    if (response.status == 200) {
      response.json().then((schedule) => {
        console.log("schedule", schedule);
        let output_up = "";
        let output_dn = "";
        //error or alert message
        if (schedule.status == 0) {
          output_up += schedule.message;
          if (schedule.url)
            output_up += `<br><a href='${schedule.url}'>${schedule.url}</a>`;
          console.log("output", output_up);
        }
        // normal data
        else {
          //delay message
          if (schedule.isdelay == "Y") {
            output_up = "No data is available";
          }
          //normal flow
          else {
            let dataUP = schedule.data[line + "-" + station].UP;
            let dataDN = schedule.data[line + "-" + station].DOWN;

            if (dataUP || dataDN) {
              const finlandTime = new Date(); // Current time in Finland
              const hongKongTime = new Date(
                finlandTime.getTime() + 6 * 60 * 60 * 1000
              ); // Add 6 hours to get Hong Kong time
              const hongKongMinutes =
                hongKongTime.getHours() * 60 + hongKongTime.getMinutes(); // Hong Kong time in minutes since midnight

              const processTrainData = (trains) => {
                let result = "";
                for (let train of trains) {
                  const [trainHour, trainMinute] = train.time
                    .slice(11, 16)
                    .split(":")
                    .map(Number); // Extract hour and minute from train time
                  let trainMinutes = trainHour * 60 + trainMinute; // Train's total minutes since midnight

                  // Handle trains scheduled past midnight
                  if (trainMinutes < hongKongMinutes) {
                    trainMinutes += 24 * 60; // Add 24 hours in minutes to account for next day
                  }

                  const timeDiff = trainMinutes - hongKongMinutes; // Calculate time difference

                  if (timeDiff >= 0) {
                    // Only display upcoming trains
                    result += `
                      <div id="train">
                        <span><b>Time:</b> ${train.time.slice(11, 16)}</span>
                        <span><b>Platform:</b> ${train.plat}</span>
                        <span><b>Destination:</b> ${
                          stnList[train.dest]?.engName || train.dest
                        }</span>
                        <span><b>Arrives in:</b> ${timeDiff} minutes</span><br>
                      </div>`;
                  }
                }
                return result;
              };

              // Process both UP and DOWN directions
              if (dataUP) {
                output_up += processTrainData(dataUP);
              } else {
                output_up += "No data is available";
              }
              if (dataDN) {
                output_dn += processTrainData(dataDN);
              } else {
                output_dn += "No data is available";
              }
            }
          }
        }
        document.getElementById("output_up").innerHTML = output_up;
        document.getElementById("output_dn").innerHTML = output_dn;
      });
    } else {
      console.log("HTTP return status: " + response.status);
    }
  });
}
