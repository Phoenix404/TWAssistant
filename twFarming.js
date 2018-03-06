var isFarmingEnabled = false;
var villagesId  = [];
var totArmy = 0;
var coordinates = [];

//------------------------
var spearSendPerAttack=50;
var axemanSendPerAttack=20;
var archerSendPerAttack=20;

var scoutSendPerAttack=1;
var LCSendPerAttack=5;
var HCSendPerAttack=50;

var ramSendPerAttack=3;
var catSendPerAttack=0;

var minArmyPerAttack=4;
var attackVillageDistance=4;
var pointVillagesDistance = 300;
var onlyKnightEnabled = true;
var intervalIdMapManager;

var sendAllArmyInOnce = false;
var timeDelay=4000;

$(document).ready(function (){
    var screen = (window.location.href).match(/screen=map/);
    villagesId = getNearAllVillages();
    console.log("Total Villages Id :" + villagesId);
    if(screen !== null) isFarmingEnabled = confirm('Are you sure you want to farming on this tab?');
    var mapXStart = getMyCoords().split("|");
    coordinates = getAllCoordinates(mapXStart[0]-attackVillageDistance, mapXStart[1]-attackVillageDistance, 9);
    if(isFarmingEnabled===true ){
        //setInterval(function () {rallyPointArmyManager();}, 1000);
        intervalIdMapManager = setInterval(function () {mapArmyManager();}, timeDelay);
        //setInterval(function () {confirmAttack();}, 500);//always
    }
});

function mapArmyManager(){
    var isFilled = false;
    confirmAttack();
    var targetId = getNextVillageId();
    CommandPopup.openRallyPoint({target:targetId});
    setTimeout(function() {
        var villageInfo = attackVillageInfo();
        console.log(villageInfo);
        if (villageInfo === null || villageInfo.length === 0) return false;
        if (villageInfo[1] > attackVillageDistance) {removeVillageId(targetId);mapArmyManager();return false}
        if (villageInfo[2] > pointVillagesDistance) {removeVillageId(targetId);mapArmyManager();return false}

        var scouts = getSpy();
        var knight = getKnight();
        totArmy = getTotalArmy();
        if (totArmy - scouts < minArmyPerAttack && getKnight() !== 1) {Dialog.close();return false;}

        if (sendAllArmyInOnce) {
                selectAllArmy();isFilled = true;
        } else {
            if (getKnight() === 1) {
                setKnight(1);
                setSpy(scoutSendPerAttack);
                isFilled = true;
            }
            if (getLight() >= LCSendPerAttack) {
                setLight(LCSendPerAttack);
                setSpy(scoutSendPerAttack);
                setRams(ramSendPerAttack);
                isFilled = true;
            }
            else if (getAxeman() >= axemanSendPerAttack) {
                setAxeman(axemanSendPerAttack);
                setSpy(scoutSendPerAttack);
                setRams(ramSendPerAttack);
                isFilled = true;
            }
            else if (getSpears() >= spearSendPerAttack) {
                setAxeman(2);
                setSpears(spearSendPerAttack);
                setSpy(scoutSendPerAttack);
                setRams(ramSendPerAttack);
                isFilled = true;
            }
            else if (getHeavy() >= HCSendPerAttack) {
                setHeavy(HCSendPerAttack);
                setSpy(scoutSendPerAttack);
                setRams(ramSendPerAttack);
                isFilled = true;
            }
            else if (totArmy >= minArmyPerAttack) {
                selectAllArmy();
                setSpy(1);
                setRams(ramSendPerAttack);
                isFilled = true;
            }
        }
        isFilled ? attack() : "";
        setTimeout(function () {
            console.log(isArmyReadyForAttack(minArmyPerAttack) + " " + isFilled + " " + onlyKnightEnabled + " " + knight + " ");
            if ((isArmyReadyForAttack(minArmyPerAttack) && isFilled === true) || (onlyKnightEnabled === true && knight === 1)) {
                confirmAttack()
            }
        }, 100);
    },500);
}

function getVillageIds($html) {return $($html).html().match(/map_village_\d+/gmi);}

function getMyVillageId() {return $("a.nowrap.tooltip-delayed").attr("href").match(/\d+/)[0];}

function getNearAllVillages() {
    $myVillageId = "#map_village_"+getMyVillageId();
    $barbarianVillages = [];
    $parent = $($myVillageId).parent().parent();
    $children = $($parent).children();
    for(var i = 0; i < $children.length; i++){
        $vId = getVillageIds($children[i]);
        $vId= getBarbsId($vId);
        if($vId.length>0)
            $barbarianVillages = $barbarianVillages.concat($vId);
    }
    return $barbarianVillages;
}

function getBarbsId(ids) {
    $barbsId = [];
    if(ids=== null ||ids.length===0 ) return [];
    for(i=0;i<ids.length;i++)
    {
        $link = $("#"+ids[i]).attr("src");
        if($link.toLowerCase().indexOf("left")>0)
            $barbsId.push(ids[i].replace("map_village_",""));
    }
    return $barbsId;
}

function geyPlayerVillageId(ids) {
    $barbsId = [];
    if(ids=== null ||ids.length===0 ) return [];
    for(i=0;i<ids.length;i++)
    {
        $link = $("#"+ids[i]).attr("src");
        if($link.toLowerCase().indexOf("left")<0)
            $barbsId.push(ids[i].replace("map_village_",""));
    }
    return $barbsId;
}

function getAllCoordinates(mapx, mapy, xXy=9) {
    var coord = [];
    for($i=mapx;$i<mapx+xXy;$i++)
        for($j=mapy;$j<mapy+xXy;$j++)
            coord.push($i+"|"+$j);
    return coord;
}

function attackVillageInfo(){
    if($(".village-item").length===0) return [null,0,0];
    var name = $(".village-item .village-name").text();
    var dist = $(".village-item .village-distance").text().match(/\d+/)[0];
    var points = $(".village-item .village-info").text().replace(".","").match(/\d+/)[0];
    return [name,parseInt(dist),parseInt(points)];
}

function goToMap(){$(".map2").click();}

function getMyCoords() {
    $coordStr = localStorage.getItem("myMainVillage");
    if ($coordStr === null) {
        $coordStr = $("b.nowrap").text();
        $str = $coordStr.match(/K\d+/);
        $coordStr = $coordStr.replace($str, "").replace("(", "").replace(")", "");
        localStorage.setItem("myMainVillage", $coordStr);
    }
    return $coordStr;
}

function isArmyReadyForAttack(min, spyInculded=false) {
    x = (getTotalUnitReadyForAttack(spyInculded));
    return x>min;
}

function getTotalUnitReadyForAttack(spyIncluded=false) {
    totUnit = parseInt($(".units-row>.unit-item.unit-item-spear").text())+
        parseInt($(".units-row>.unit-item.unit-item-axe").text())+
        parseInt($(".units-row>.unit-item.unit-item-sword").text())+
        parseInt($(".units-row>.unit-item.unit-item-archer").text())+
        parseInt($(".units-row>.unit-item.unit-item-marcher").text())+
        parseInt($(".units-row>.unit-item.unit-item-heavy").text())+
        parseInt($(".units-row>.unit-item.unit-item-ram").text())+
        parseInt($(".units-row>.unit-item.unit-item-catapult").text())+
        parseInt($(".units-row>.unit-item.unit-item-knight").text())+
        parseInt($(".units-row>.unit-item-light").text());

    if(spyIncluded) parseInt($(".units-row>.unit-item.unit-item-spy").text());
    return totUnit;
}

function prepareCoordinate() {
    if (Math.floor(Math.random() * 10000) % 7 === 0)
        setCoordinate(getRandomCoordinate());
    else
        setCoordinate(getNextCoordinate());
}

function setCoordinate(num) {
    $(".target-input-field").val(num);
}

function getRandomCoordinate() {
    return coordinates[Math.floor(Math.random() * coordinates.length)];
}

function getNextCoordinate() {
    if(coordinates.length===0) return "";
    $coord = localStorage.getItem("currentTargetVillage");
    if ($coord === null) {
        $coord = coordinates[0];
        localStorage.setItem("currentTargetVillage", 0);
    } else {
        $totalCoordinates = coordinates.length - 1;
        if ($coord <= $totalCoordinates) {
            $coord++;
            localStorage.setItem("currentTargetVillage", $coord);
            $coord = coordinates[$coord];
        } else {
            localStorage.setItem("currentTargetVillage", 0);
            $coord = coordinates[0];
        }
    }
    return $coord;
}

function getNextVillageId() {
    if(villagesId.length===0) return "";
    $coord = localStorage.getItem("currentVillageId");
    if ($coord === null) {
        $coord = villagesId[0];
        localStorage.setItem("currentVillageId", 0);
    } else {
        $totalCoordinates = villagesId.length - 1;
        if ($coord <= $totalCoordinates) {
            $coord++;
            localStorage.setItem("currentVillageId", $coord);
            $coord = villagesId[$coord];
        } else {
            localStorage.setItem("currentVillageId", 0);
            $coord = villagesId[0];
        }
    }
    return $coord;
}

function setPreviousCoordinate() {
    $("a.target-quickbutton.target-last-attacked").click();
}

function getMyPoint(){
    return $("#rank_points").text();
}

function attack() {
    console.log("Attackl");
    $("#target_attack").click();
}

function confirmAttack() {
    $("#troop_confirm_go").click();
    Dialog.close();
}

function selectAllArmy(){$("#selectAllUnits").click();}

function getSpears() {
    return parseInt($("#units_entry_all_spear").text().replace("(", "").replace(")", ""));
}

function getSword() {
    return parseInt($("#units_entry_all_sword").text().replace("(", "").replace(")", ""));
}

function getAxeman() {
    return parseInt($("#units_entry_all_axe").text().replace("(", "").replace(")", ""));
}

function getArcher() {
    return parseInt($("#units_entry_all_archer").text().replace("(", "").replace(")", ""));
}

function getSpy() {
    return parseInt($("#units_entry_all_spy").text().replace("(", "").replace(")", ""));
}

function getLight() {
    return parseInt($("#units_entry_all_light").text().replace("(", "").replace(")", ""));
}

function getMacrher() {
    return parseInt($("#units_entry_all_marcher").text().replace("(", "").replace(")", ""));
}

function getHeavy() {
    return parseInt($("#units_entry_all_heavy").text().replace("(", "").replace(")", ""));
}

function getRams() {
    return parseInt($("#units_entry_all_ram").text().replace("(", "").replace(")", ""));
}

function getCats() {
    return parseInt($("#units_entry_all_catapult").text().replace("(", "").replace(")", ""));
}

function getKnight() {
    return parseInt($("#units_entry_all_knight").text().replace("(", "").replace(")", ""));
}

function getTotalArmy() {
    return getSpears() + getSword() + getAxeman() + getArcher() + getSpy() + getLight() + getMacrher() + getHeavy() + getRams() + getCats() + getKnight();
}

function setSpears(num) {
    if(getSpears()<num) return false;
    return $("#unit_input_spear").val(num);
}

function setSword(num) {
    if(getSword()<num) return false;
    return $("#unit_input_sword").val(num);
}

function setAxeman(num) {
    if(getAxeman()<num) return false;
    return $("#unit_input_axe").val(num);
}

function setArcher(num) {
    if(getArcher()<num) return false;
    return $("#unit_input_archer").val(num);
}

function setSpy(num) {
    if(getSpy()<num) return false;
    return $("#unit_input_spy").val(num);
}

function setLight(num){
    if(getLight()<num) return false;
    return $("#unit_input_light").val(num);
}

function setMacrher(num) {
    if(getMacrher()<num) return false;
    return $("#unit_input_marcher").val(num);
}

function setHeavy(num) {
    if(getHeavy()<num) return false;
    return $("#unit_input_heavy").val(num);
}

function setRams(num) {
    if(getRams()<num) return false;
    return $("#unit_input_ram").val(num);
}

function setCats(num) {
    if(getCats()<num) return false;
    return $("#unit_input_catapult").val(num);
}

function setKnight(num) {
    return $("#unit_input_knight").val(num);
}

function addCoordinate(coord){
    coordinates.push(coord);
}

function removeVillageId(id){
    villagesId.splice(villagesId.findIndex(x => x==id), 1);
}

function addVillageId(id){
    villagesId.push(id);
}
