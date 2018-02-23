var isFarmingEnabled = false;
var villagesId  = [];
var totArmy = 0;

//------------------------
var spearSendPerAttack=20;
var axemanSendPerAttack=20;
var archerSendPerAttack=20;

var scoutSendPerAttack=1;
var LCSendPerAttack=5;
var HCSendPerAttack=50;

var ramSendPerAttack=15;
var catSendPerAttack=0;

var minArmyPerAttack=10;
var attackVillageDistance=4;
var pointVillagesDistance = 150;
var onlyKnightEnabled = false;

$(document).ready(function (){
    var screen = (window.location.href).match(/screen=map/);
    if(screen !== null) isFarmingEnabled = confirm('Are you sure you want to Farming?');
    if(isFarmingEnabled===true ){
        var nearVillages = 4;
        var mapXStart = getMyCoords().split("|");
        var mapYStart= mapXStart[1]-nearVillages;
        mapXStart=mapXStart[0]-nearVillages;
        var coordinates = getAllCoordinates(mapXStart, mapYStart, 9);
        villagesId = getNearAllVillages();

        //setInterval(function () {rallyPointArmyManager();}, 1000);
        setInterval(function () {mapArmyManager();}, 4000);
        setInterval(function () {confirmAttack();}, 500);//always
        console.log("Total Villages Id :" + villagesId);
    }

    function getVillageIds($html) {return $($html).html().match(/map_village_\d+/gmi);}
    function getMyVillageId() {return $("a.nowrap.tooltip-delayed").attr("href").match(/\d+/)[0];}

    function getNearAllVillages() {
        $myVillageId = "#map_village_"+getMyVillageId();
        $barbarianVillages = [];
        $parent = $($myVillageId).parent();
        $parent = getVillageIds($parent);
        $parent = getBarbsId($parent);
        $uRelative = $($($myVillageId).parent()).next();
        $uRelative = getVillageIds($uRelative);
        $uRelative = getBarbsId($uRelative);
        $bRelative = $($($myVillageId).parent()).prev();
        $bRelative = getVillageIds($bRelative);
        $bRelative = getBarbsId($bRelative);
        $barbarianVillages = $barbarianVillages.concat($parent); // near village
        $barbarianVillages = $barbarianVillages.concat($uRelative); // a little bit far
        $barbarianVillages = $barbarianVillages.concat($bRelative); // a little bit far
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

    function rallyPointArmyManager() {
        totArmy = getTotalArmy();
        if (totArmy < 10) {
            return false;
        }
        prepareCoordinate();
        if (totArmy === 1 && getKnight() === 1) {
            setKnight(1);
            attack();
        }
        if (getLight() >= 40) {
            setLight(40);
            setSpy(1);
            attack();
        }
        if (getAxeman() >= 100) {
            setAxeman(100);
            setSpy(1);
            attack();
        }
    }

    function mapArmyManager(){
        var isfilled = false;
        var scouts = getSpy();
        
        CommandPopup.openRallyPoint({target:getNextVillageId()});
        
        var villageInfo = attackVillageInfo();
        console.log(villageInfo);
        if(villageInfo===null || villageInfo.length===0) return false;
        console.log("not null");
        if(villageInfo[1]>attackVillageDistance) return false;
        console.log("village distance pass");
        if(villageInfo[2]>pointVillagesDistance) return false;
        console.log("Villa point pass");
        
        totArmy = getTotalArmy();
        
        if(totArmy-scouts < minArmyPerAttack && getKnight()!==1){
            Dialog.close();
            return false;
        }

        if(getKnight()===1){setKnight(1);setSpy(scoutSendPerAttack);isfilled=true;}
        if(getLight() >= LCSendPerAttack){setLight(LCSendPerAttack);setSpy(scoutSendPerAttack);setRams(ramSendPerAttack);isfilled=true;}
        else if(getAxeman() >= axemanSendPerAttack){setAxeman(axemanSendPerAttack);setSpy(scoutSendPerAttack);setRams(ramSendPerAttack);isfilled=true;}
        else if(getSpears() >= spearSendPerAttack){setSpears(spearSendPerAttack);setSpy(scoutSendPerAttack);setRams(ramSendPerAttack);isfilled=true;}
        else if(getHeavy() >= HCSendPerAttack){setHeavy(HCSendPerAttack);setSpy(scoutSendPerAttack);setRams(ramSendPerAttack);isfilled=true;}
        else if(totArmy >= minArmyPerAttack){selectAllArmy();setSpy(1);setRams(ramSendPerAttack);isfilled=true;}
        if(totArmy-scouts <= minArmyPerAttack || isfilled===false) {
            console.log("army less");
            if(onlyKnightEnabled===false && getKnight() == 1){
                Dialog.close();
                return false;
            }
            
             console.log("Attacking");
        }

        //if(isUnitSendAble(50))
        attack();
        //else
        //Dialog.close();
    }

    function isUnitSendAble(max) {
        totUnit = parseInt($(".units-row>.unit-item.unit-item-spear").text())+
            parseInt($(".units-row>.unit-item.unit-item-axe").text())+
            parseInt($(".units-row>.unit-item-light").text());
        return totUnit>=max;
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

    function isAttackAble(){

    }

    function attack() {
        $("#target_attack").click();
    }

    function confirmAttack() {
        $("#troop_confirm_go").click();
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

});


function addCoordinate(coord){
    coordinates.push(coord);
}

function addVillageId(id){
    villagesId.push(id);
}
