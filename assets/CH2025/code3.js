gdjs.HouseCode = {};
gdjs.HouseCode.localVariables = [];
gdjs.HouseCode.idToCallbackMap = new Map();
gdjs.HouseCode.GDStartObjects1= [];
gdjs.HouseCode.GDStartObjects2= [];
gdjs.HouseCode.GDStartObjects3= [];
gdjs.HouseCode.GDBad_9595EndingObjects1= [];
gdjs.HouseCode.GDBad_9595EndingObjects2= [];
gdjs.HouseCode.GDBad_9595EndingObjects3= [];
gdjs.HouseCode.GDGood_9595EndingObjects1= [];
gdjs.HouseCode.GDGood_9595EndingObjects2= [];
gdjs.HouseCode.GDGood_9595EndingObjects3= [];
gdjs.HouseCode.GDSentence_95952Objects1= [];
gdjs.HouseCode.GDSentence_95952Objects2= [];
gdjs.HouseCode.GDSentence_95952Objects3= [];
gdjs.HouseCode.GDCode_9595InputObjects1= [];
gdjs.HouseCode.GDCode_9595InputObjects2= [];
gdjs.HouseCode.GDCode_9595InputObjects3= [];
gdjs.HouseCode.GDGreenButtonWithShadowObjects1= [];
gdjs.HouseCode.GDGreenButtonWithShadowObjects2= [];
gdjs.HouseCode.GDGreenButtonWithShadowObjects3= [];


gdjs.HouseCode.asyncCallback15576828 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.HouseCode.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Sentence_2"), gdjs.HouseCode.GDSentence_95952Objects3);

{for(var i = 0, len = gdjs.HouseCode.GDSentence_95952Objects3.length ;i < len;++i) {
    gdjs.HouseCode.GDSentence_95952Objects3[i].hide();
}
}
gdjs.HouseCode.localVariables.length = 0;
}
gdjs.HouseCode.idToCallbackMap.set(15576828, gdjs.HouseCode.asyncCallback15576828);
gdjs.HouseCode.eventsList0 = function(runtimeScene, asyncObjectsList) {

{


{
const parentAsyncObjectsList = asyncObjectsList;
{
const asyncObjectsList = gdjs.LongLivedObjectsList.from(parentAsyncObjectsList);
asyncObjectsList.backupLocalVariablesContainers(gdjs.HouseCode.localVariables);
for (const obj of gdjs.HouseCode.GDSentence_95952Objects2) asyncObjectsList.addObject("Sentence_2", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(3), (runtimeScene) => (gdjs.HouseCode.asyncCallback15576828(runtimeScene, asyncObjectsList)), 15576828, asyncObjectsList);
}
}

}


};gdjs.HouseCode.asyncCallback13513324 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.HouseCode.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Sentence_2"), gdjs.HouseCode.GDSentence_95952Objects2);

{for(var i = 0, len = gdjs.HouseCode.GDSentence_95952Objects2.length ;i < len;++i) {
    gdjs.HouseCode.GDSentence_95952Objects2[i].hide(false);
}
}

{ //Subevents
gdjs.HouseCode.eventsList0(runtimeScene, asyncObjectsList);} //End of subevents
gdjs.HouseCode.localVariables.length = 0;
}
gdjs.HouseCode.idToCallbackMap.set(13513324, gdjs.HouseCode.asyncCallback13513324);
gdjs.HouseCode.eventsList1 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.HouseCode.localVariables);
for (const obj of gdjs.HouseCode.GDSentence_95952Objects1) asyncObjectsList.addObject("Sentence_2", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(12), (runtimeScene) => (gdjs.HouseCode.asyncCallback13513324(runtimeScene, asyncObjectsList)), 13513324, asyncObjectsList);
}
}

}


};gdjs.HouseCode.eventsList2 = function(runtimeScene) {

{

gdjs.copyArray(runtimeScene.getObjects("Code_Input"), gdjs.HouseCode.GDCode_9595InputObjects2);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.HouseCode.GDCode_9595InputObjects2.length;i<l;++i) {
    if ( gdjs.HouseCode.GDCode_9595InputObjects2[i].getBehavior("Text").getText() != "6761" ) {
        isConditionTrue_0 = true;
        gdjs.HouseCode.GDCode_9595InputObjects2[k] = gdjs.HouseCode.GDCode_9595InputObjects2[i];
        ++k;
    }
}
gdjs.HouseCode.GDCode_9595InputObjects2.length = k;
if (isConditionTrue_0) {
gdjs.copyArray(gdjs.HouseCode.GDBad_9595EndingObjects1, gdjs.HouseCode.GDBad_9595EndingObjects2);

/* Reuse gdjs.HouseCode.GDCode_9595InputObjects2 */
gdjs.copyArray(gdjs.HouseCode.GDGreenButtonWithShadowObjects1, gdjs.HouseCode.GDGreenButtonWithShadowObjects2);

gdjs.copyArray(gdjs.HouseCode.GDStartObjects1, gdjs.HouseCode.GDStartObjects2);

{for(var i = 0, len = gdjs.HouseCode.GDStartObjects2.length ;i < len;++i) {
    gdjs.HouseCode.GDStartObjects2[i].hide();
}
}
{for(var i = 0, len = gdjs.HouseCode.GDBad_9595EndingObjects2.length ;i < len;++i) {
    gdjs.HouseCode.GDBad_9595EndingObjects2[i].hide(false);
}
}
{for(var i = 0, len = gdjs.HouseCode.GDBad_9595EndingObjects2.length ;i < len;++i) {
    gdjs.HouseCode.GDBad_9595EndingObjects2[i].play();
}
}
{for(var i = 0, len = gdjs.HouseCode.GDGreenButtonWithShadowObjects2.length ;i < len;++i) {
    gdjs.HouseCode.GDGreenButtonWithShadowObjects2[i].hide();
}
}
{for(var i = 0, len = gdjs.HouseCode.GDCode_9595InputObjects2.length ;i < len;++i) {
    gdjs.HouseCode.GDCode_9595InputObjects2[i].hide();
}
}
{gdjs.evtTools.sound.playSound(runtimeScene, "alarm-car-or-home-62554.mp3", false, 100, 1);
}
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Code_Input"), gdjs.HouseCode.GDCode_9595InputObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.HouseCode.GDCode_9595InputObjects1.length;i<l;++i) {
    if ( gdjs.HouseCode.GDCode_9595InputObjects1[i].getBehavior("Text").getText() == "6761" ) {
        isConditionTrue_0 = true;
        gdjs.HouseCode.GDCode_9595InputObjects1[k] = gdjs.HouseCode.GDCode_9595InputObjects1[i];
        ++k;
    }
}
gdjs.HouseCode.GDCode_9595InputObjects1.length = k;
if (isConditionTrue_0) {
/* Reuse gdjs.HouseCode.GDCode_9595InputObjects1 */
/* Reuse gdjs.HouseCode.GDGood_9595EndingObjects1 */
/* Reuse gdjs.HouseCode.GDGreenButtonWithShadowObjects1 */
/* Reuse gdjs.HouseCode.GDStartObjects1 */
{for(var i = 0, len = gdjs.HouseCode.GDStartObjects1.length ;i < len;++i) {
    gdjs.HouseCode.GDStartObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.HouseCode.GDGood_9595EndingObjects1.length ;i < len;++i) {
    gdjs.HouseCode.GDGood_9595EndingObjects1[i].hide(false);
}
}
{for(var i = 0, len = gdjs.HouseCode.GDGood_9595EndingObjects1.length ;i < len;++i) {
    gdjs.HouseCode.GDGood_9595EndingObjects1[i].play();
}
}
{for(var i = 0, len = gdjs.HouseCode.GDGreenButtonWithShadowObjects1.length ;i < len;++i) {
    gdjs.HouseCode.GDGreenButtonWithShadowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.HouseCode.GDCode_9595InputObjects1.length ;i < len;++i) {
    gdjs.HouseCode.GDCode_9595InputObjects1[i].hide();
}
}
}

}


};gdjs.HouseCode.eventsList3 = function(runtimeScene) {

{



}


{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.wasKeyJustPressed(runtimeScene, "Escape");
if (isConditionTrue_0) {
{gdjs.evtTools.window.setFullScreen(runtimeScene, false, true);
}
}

}


{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.runtimeScene.sceneJustBegins(runtimeScene);
if (isConditionTrue_0) {
gdjs.copyArray(runtimeScene.getObjects("Bad_Ending"), gdjs.HouseCode.GDBad_9595EndingObjects1);
gdjs.copyArray(runtimeScene.getObjects("Code_Input"), gdjs.HouseCode.GDCode_9595InputObjects1);
gdjs.copyArray(runtimeScene.getObjects("Good_Ending"), gdjs.HouseCode.GDGood_9595EndingObjects1);
gdjs.copyArray(runtimeScene.getObjects("GreenButtonWithShadow"), gdjs.HouseCode.GDGreenButtonWithShadowObjects1);
gdjs.copyArray(runtimeScene.getObjects("Sentence_2"), gdjs.HouseCode.GDSentence_95952Objects1);
gdjs.copyArray(runtimeScene.getObjects("Start"), gdjs.HouseCode.GDStartObjects1);
{for(var i = 0, len = gdjs.HouseCode.GDSentence_95952Objects1.length ;i < len;++i) {
    gdjs.HouseCode.GDSentence_95952Objects1[i].hide();
}
}
{for(var i = 0, len = gdjs.HouseCode.GDCode_9595InputObjects1.length ;i < len;++i) {
    gdjs.HouseCode.GDCode_9595InputObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.HouseCode.GDGreenButtonWithShadowObjects1.length ;i < len;++i) {
    gdjs.HouseCode.GDGreenButtonWithShadowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.HouseCode.GDBad_9595EndingObjects1.length ;i < len;++i) {
    gdjs.HouseCode.GDBad_9595EndingObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.HouseCode.GDGood_9595EndingObjects1.length ;i < len;++i) {
    gdjs.HouseCode.GDGood_9595EndingObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.HouseCode.GDStartObjects1.length ;i < len;++i) {
    gdjs.HouseCode.GDStartObjects1[i].play();
}
}
{gdjs.evtTools.sound.playMusic(runtimeScene, "2025-04-15_-_Skin_Of_Your_Teeth_-_www.FesliyanStudios.com.mp3", true, 100, 1);
}

{ //Subevents
gdjs.HouseCode.eventsList1(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Start"), gdjs.HouseCode.GDStartObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.HouseCode.GDStartObjects1.length;i<l;++i) {
    if ( gdjs.HouseCode.GDStartObjects1[i].isEnded() ) {
        isConditionTrue_0 = true;
        gdjs.HouseCode.GDStartObjects1[k] = gdjs.HouseCode.GDStartObjects1[i];
        ++k;
    }
}
gdjs.HouseCode.GDStartObjects1.length = k;
if (isConditionTrue_0) {
isConditionTrue_0 = false;
{isConditionTrue_0 = !runtimeScene.getScene().getVariables().getFromIndex(0).getAsBoolean();
}
}
if (isConditionTrue_0) {
gdjs.copyArray(runtimeScene.getObjects("Code_Input"), gdjs.HouseCode.GDCode_9595InputObjects1);
gdjs.copyArray(runtimeScene.getObjects("GreenButtonWithShadow"), gdjs.HouseCode.GDGreenButtonWithShadowObjects1);
{for(var i = 0, len = gdjs.HouseCode.GDCode_9595InputObjects1.length ;i < len;++i) {
    gdjs.HouseCode.GDCode_9595InputObjects1[i].hide(false);
}
}
{for(var i = 0, len = gdjs.HouseCode.GDGreenButtonWithShadowObjects1.length ;i < len;++i) {
    gdjs.HouseCode.GDGreenButtonWithShadowObjects1[i].hide(false);
}
}
{runtimeScene.getScene().getVariables().getFromIndex(0).setBoolean(true);
}
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Bad_Ending"), gdjs.HouseCode.GDBad_9595EndingObjects1);
gdjs.copyArray(runtimeScene.getObjects("Good_Ending"), gdjs.HouseCode.GDGood_9595EndingObjects1);
gdjs.copyArray(runtimeScene.getObjects("GreenButtonWithShadow"), gdjs.HouseCode.GDGreenButtonWithShadowObjects1);
gdjs.copyArray(runtimeScene.getObjects("Start"), gdjs.HouseCode.GDStartObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.HouseCode.GDGreenButtonWithShadowObjects1.length;i<l;++i) {
    if ( gdjs.HouseCode.GDGreenButtonWithShadowObjects1[i].IsPressed(null) ) {
        isConditionTrue_0 = true;
        gdjs.HouseCode.GDGreenButtonWithShadowObjects1[k] = gdjs.HouseCode.GDGreenButtonWithShadowObjects1[i];
        ++k;
    }
}
gdjs.HouseCode.GDGreenButtonWithShadowObjects1.length = k;
if (isConditionTrue_0) {
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.HouseCode.GDStartObjects1.length;i<l;++i) {
    if ( gdjs.HouseCode.GDStartObjects1[i].isEnded() ) {
        isConditionTrue_0 = true;
        gdjs.HouseCode.GDStartObjects1[k] = gdjs.HouseCode.GDStartObjects1[i];
        ++k;
    }
}
gdjs.HouseCode.GDStartObjects1.length = k;
if (isConditionTrue_0) {
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.HouseCode.GDBad_9595EndingObjects1.length;i<l;++i) {
    if ( gdjs.HouseCode.GDBad_9595EndingObjects1[i].isPaused() ) {
        isConditionTrue_0 = true;
        gdjs.HouseCode.GDBad_9595EndingObjects1[k] = gdjs.HouseCode.GDBad_9595EndingObjects1[i];
        ++k;
    }
}
gdjs.HouseCode.GDBad_9595EndingObjects1.length = k;
if (isConditionTrue_0) {
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.HouseCode.GDGood_9595EndingObjects1.length;i<l;++i) {
    if ( gdjs.HouseCode.GDGood_9595EndingObjects1[i].isPaused() ) {
        isConditionTrue_0 = true;
        gdjs.HouseCode.GDGood_9595EndingObjects1[k] = gdjs.HouseCode.GDGood_9595EndingObjects1[i];
        ++k;
    }
}
gdjs.HouseCode.GDGood_9595EndingObjects1.length = k;
}
}
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.HouseCode.eventsList2(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Bad_Ending"), gdjs.HouseCode.GDBad_9595EndingObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.HouseCode.GDBad_9595EndingObjects1.length;i<l;++i) {
    if ( gdjs.HouseCode.GDBad_9595EndingObjects1[i].isEnded() ) {
        isConditionTrue_0 = true;
        gdjs.HouseCode.GDBad_9595EndingObjects1[k] = gdjs.HouseCode.GDBad_9595EndingObjects1[i];
        ++k;
    }
}
gdjs.HouseCode.GDBad_9595EndingObjects1.length = k;
if (isConditionTrue_0) {
{gdjs.evtTools.runtimeScene.replaceScene(runtimeScene, "Bad Ending", false);
}
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Good_Ending"), gdjs.HouseCode.GDGood_9595EndingObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.HouseCode.GDGood_9595EndingObjects1.length;i<l;++i) {
    if ( gdjs.HouseCode.GDGood_9595EndingObjects1[i].isEnded() ) {
        isConditionTrue_0 = true;
        gdjs.HouseCode.GDGood_9595EndingObjects1[k] = gdjs.HouseCode.GDGood_9595EndingObjects1[i];
        ++k;
    }
}
gdjs.HouseCode.GDGood_9595EndingObjects1.length = k;
if (isConditionTrue_0) {
{gdjs.evtTools.runtimeScene.replaceScene(runtimeScene, "Good Ending", false);
}
}

}


};

gdjs.HouseCode.func = function(runtimeScene) {
runtimeScene.getOnceTriggers().startNewFrame();

gdjs.HouseCode.GDStartObjects1.length = 0;
gdjs.HouseCode.GDStartObjects2.length = 0;
gdjs.HouseCode.GDStartObjects3.length = 0;
gdjs.HouseCode.GDBad_9595EndingObjects1.length = 0;
gdjs.HouseCode.GDBad_9595EndingObjects2.length = 0;
gdjs.HouseCode.GDBad_9595EndingObjects3.length = 0;
gdjs.HouseCode.GDGood_9595EndingObjects1.length = 0;
gdjs.HouseCode.GDGood_9595EndingObjects2.length = 0;
gdjs.HouseCode.GDGood_9595EndingObjects3.length = 0;
gdjs.HouseCode.GDSentence_95952Objects1.length = 0;
gdjs.HouseCode.GDSentence_95952Objects2.length = 0;
gdjs.HouseCode.GDSentence_95952Objects3.length = 0;
gdjs.HouseCode.GDCode_9595InputObjects1.length = 0;
gdjs.HouseCode.GDCode_9595InputObjects2.length = 0;
gdjs.HouseCode.GDCode_9595InputObjects3.length = 0;
gdjs.HouseCode.GDGreenButtonWithShadowObjects1.length = 0;
gdjs.HouseCode.GDGreenButtonWithShadowObjects2.length = 0;
gdjs.HouseCode.GDGreenButtonWithShadowObjects3.length = 0;

gdjs.HouseCode.eventsList3(runtimeScene);
gdjs.HouseCode.GDStartObjects1.length = 0;
gdjs.HouseCode.GDStartObjects2.length = 0;
gdjs.HouseCode.GDStartObjects3.length = 0;
gdjs.HouseCode.GDBad_9595EndingObjects1.length = 0;
gdjs.HouseCode.GDBad_9595EndingObjects2.length = 0;
gdjs.HouseCode.GDBad_9595EndingObjects3.length = 0;
gdjs.HouseCode.GDGood_9595EndingObjects1.length = 0;
gdjs.HouseCode.GDGood_9595EndingObjects2.length = 0;
gdjs.HouseCode.GDGood_9595EndingObjects3.length = 0;
gdjs.HouseCode.GDSentence_95952Objects1.length = 0;
gdjs.HouseCode.GDSentence_95952Objects2.length = 0;
gdjs.HouseCode.GDSentence_95952Objects3.length = 0;
gdjs.HouseCode.GDCode_9595InputObjects1.length = 0;
gdjs.HouseCode.GDCode_9595InputObjects2.length = 0;
gdjs.HouseCode.GDCode_9595InputObjects3.length = 0;
gdjs.HouseCode.GDGreenButtonWithShadowObjects1.length = 0;
gdjs.HouseCode.GDGreenButtonWithShadowObjects2.length = 0;
gdjs.HouseCode.GDGreenButtonWithShadowObjects3.length = 0;


return;

}

gdjs['HouseCode'] = gdjs.HouseCode;
