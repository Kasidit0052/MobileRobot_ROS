var currentMode = null;
var gridNavClient = null;

// add variable to track added points
var currentPointList = [];

async function handleMode(mode) {
  console.log(mode);
  const teleopElems = Array.from(document.querySelectorAll(".teleopBtn"));
  if (mode === "manual") {
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = false;
    });
    document.querySelector(".navigationBtn").disabled = true;
    document.querySelector(".initialBtn").disabled = true;
    document.querySelector(".emergencyBtn").disabled = true;
    document.querySelector(".savepointBtn").disabled = true;
    const manual = document.querySelector(".manualBtn");
    manual.disabled = false;
    manual.innerText = "STOP MANUAL";
    manual.classList.remove(".manualBtn");
    manual.classList.remove(".mui-btn--primary");
    manual.classList.add("mui-btn--danger");
    manual.classList.add(".stopManual");
    manual.setAttribute("onclick", "handleStopManual()");
    currentMode = "manual";
  } else if (mode === "nav") {
    document.querySelector(".savepointBtn").disabled = false;
    console.log(teleopOn);
    const selectElem = document.querySelector(".mapSelect");
    const nav = document.querySelector(".navigationBtn");
    nav.disabled = false;
    nav.innerText = "STOP NAVIGATION";
    nav.classList.remove(".navigationBtn");
    nav.classList.remove(".mui-btn--primary");
    nav.classList.add("mui-btn--danger");
    nav.classList.add(".stopNavigation");
    nav.setAttribute("onclick", "handleStopnavigation()");

    document.querySelector(".manualBtn").disabled = true;
    document.querySelector(".initialBtn").disabled = false;
    document.querySelector(".emergencyBtn").disabled = false;
    currentMode = "nav";
    await navigation(selectElem.value);

    // add fetch point
    var points = await FetchPoint();
    if (Array.isArray(points)) {
      queryPoint(points);
    }

    gridNavClient = new NAV2D.OccupancyGridClientNav({
      ros: ros,
      rootObject: viewer.scene,
      viewer: viewer,
      serverName: "/move_base",
      withOrientation: true,
      arrowSize: 15,
    });
    pose_listener_amcl.subscribe(nav_callback);
    gridNavClient.rootObject.addChild(navMarker);
    if (teleopOn == true) {
      teleopElems.forEach((teleopElem) => {
        teleopElem.disabled = false;
      });
    } else {
      teleopElems.forEach((teleopElem) => {
        teleopElem.disabled = true;
      });
    }
  } else if (mode === "slam") {
    document.querySelector(".savepointBtn").disabled = true;
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = false;
    });
    document.querySelector(".manualBtn").disabled = true;
    document.querySelector(".navigationBtn").disabled = true;
    document.querySelector(".initialBtn").disabled = true;
    document.querySelector(".activeMapBtn").disabled = true;
    document.querySelector(".createMapBtn").disabled = true;
    document.querySelector(".saveMapBtn").disabled = false;
    document.querySelector(".deleteMapBtn").disabled = true;
    document.querySelector(".emergencyBtn").disabled = true;
    pose_listener_odom.subscribe(odom_callback);
    gridClient.rootObject.addChild(slamMarker);
    currentMode = "slam";
  } else if (mode === "start-up") {
    document.querySelector(".savepointBtn").disabled = true;
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = true;
    });
    document.querySelector(".manualBtn").disabled = false;
    document.querySelector(".navigationBtn").disabled = true;
    document.querySelector(".initialBtn").disabled = true;
    document.querySelector(".deleteMapBtn").disabled = true;
    document.querySelector(".emergencyBtn").disabled = true;
  } else if (mode === "map-editor") {
    document.querySelector(".savepointBtn").disabled = true;
    document.querySelector(".mapSelect").disabled = true;
    document.querySelector(".manualBtn").disabled = true;
    document.querySelector(".navigationBtn").disabled = false;
    document.querySelector(".initialBtn").disabled = true;
    document.querySelector(".createMapBtn").disabled = true;
    document.querySelector(".saveMapBtn").disabled = true;
    document.querySelector(".deleteMapBtn").disabled = false;
    document.querySelector(".emergencyBtn").disabled = true;
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = true;
    });
  }
}

async function handleStopnavigation() {
  const nav = document.querySelector(".navigationBtn");
  nav.innerText = "MANUAL";
  nav.classList.remove("mui-btn--danger");
  nav.classList.remove(".stopNavigation");
  nav.classList.add(".mui-btn--primary");
  nav.classList.add(".manualBtn");
  nav.setAttribute("onclick", "handleMode('nav')");
  window.location.reload();
}

async function handleStopManual() {
  const manual = document.querySelector(".stopManual");
  manual.innerText = "manual";
  manual.classList.remove("mui-btn--danger");
  manual.classList.remove(".stopManual");
  manual.classList.add(".manualBtn");
  manual.classList.add(".mui-btn--primary");
  manual.setAttribute("onclick", "handleMode('manual')");
  window.location.reload();
}

async function handleemergency() {
  //add
  output_log = gridNavClient.navigator.cancelGoal;
  console.log(output_log);
  const response = await emergencySend();
  console.log(response);
}

async function emergencySend() {
  const response = await fetch(`http://${localhost}:8000/api/robot_cancel`);
  return response.json();
}

async function handleinitpose() {
  initPose = true;
}

///////////// add Handle save points
async function handlesavepoint() {
  point_name = prompt();
  if (point_name) {
    // save points
    savePoint(point_name);
  }
}

async function savePoint(input) {
  const response = await fetch(`http://${localhost}:8000/api/savePoint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: input }),
  });

  // update added point
  points = await FetchPoint();
  if (Array.isArray(points)) {
    // rendering html element for added point
    currentPointList = points;
    queryPoint(currentPointList[currentPointList.length - 1]);
  }
}
/////////////

//////////// add Load point
async function FetchPoint() {
  const response = await fetch(`http://${localhost}:8000/api/loadPoint`);
  const pointList = await response.json();
  return pointList;
}

function queryPoint(points) {
  var table = document.getElementById("itemtable_table");

  // First Time rendering
  if (points != null && Array.isArray(points)) {
    points.map((value, index) => {
      var row = table.insertRow();

      // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
      var cell1 = row.insertCell(0);
      var cell2 = row.insertCell(1);
      var cell3 = row.insertCell(2);

      // Add some text to the new cells:
      cell1.innerHTML = value;
      cell2.innerHTML = `<button type="button" value=${index} onclick="handleMoveToPoint(${index})" class="btn btn-primary">GO TO POINT</button>`;
      cell3.innerHTML = `<button type="button" value=${index} onclick="handleMoveToPoint(${index})" class="btn btn-danger">DELETE POINT</button>`;
    });
  }

  // Rendering after added points
  if (points != null && typeof points === "string") {
    var row = table.insertRow(currentPointList.length);

    // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);

    // Add some text to the new cells:
    cell1.innerHTML = points;
    cell2.innerHTML = `<button type="button" value=${
      currentPointList.length - 1
    } onclick="handleMoveToPoint(${
      currentPointList.length - 1
    })" class="btn btn-primary">GO TO POINT</button>`;
    cell3.innerHTML = `<button type="button" value=${
      currentPointList.length - 1
    } onclick="handleDeletePoint(${
      currentPointList.length - 1
    })" class="btn btn-danger">DELETE POINT</button>`;
  }
}
////////////

//////////// add move to point features
function handleMoveToPoint(input) {
  moveToPoint(input);
  console.log(input);
}

async function moveToPoint(input) {
  const response = await fetch(`http://${localhost}:8000/api/moveBasePoint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ location_index: input }),
  });
}

async function handleDeletePoint(input) {
  var confirm = window.confirm("Press a button to save!");
  if (confirm === true) {
    document.getElementById("itemtable_table").deleteRow(input);
    await deletePoint(input);
  }
}

async function deletePoint(input) {
  const response = await fetch(`http://${localhost}:8000/api/deletePoint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ location_index: input }),
  });

  deletePointTable(input);
  console.log(input);
}

function deletePointTable(input) {
  var table = document.getElementById("itemtable_table");
  table.deleteRow(input);
}
