gdjs.Dream1Code = {};
gdjs.Dream1Code.localVariables = [];
gdjs.Dream1Code.idToCallbackMap = new Map();
gdjs.Dream1Code.GDDark_9595LightObjects1= [];
gdjs.Dream1Code.GDDark_9595LightObjects2= [];
gdjs.Dream1Code.GDDark_9595LightObjects3= [];
gdjs.Dream1Code.GDLetter_9595KeyObjects1= [];
gdjs.Dream1Code.GDLetter_9595KeyObjects2= [];
gdjs.Dream1Code.GDLetter_9595KeyObjects3= [];
gdjs.Dream1Code.GDUp_9595ArrowObjects1= [];
gdjs.Dream1Code.GDUp_9595ArrowObjects2= [];
gdjs.Dream1Code.GDUp_9595ArrowObjects3= [];
gdjs.Dream1Code.GDLeft_9595ArrowObjects1= [];
gdjs.Dream1Code.GDLeft_9595ArrowObjects2= [];
gdjs.Dream1Code.GDLeft_9595ArrowObjects3= [];
gdjs.Dream1Code.GDRight_9595ArrowObjects1= [];
gdjs.Dream1Code.GDRight_9595ArrowObjects2= [];
gdjs.Dream1Code.GDRight_9595ArrowObjects3= [];
gdjs.Dream1Code.GDSentence_95951Objects1= [];
gdjs.Dream1Code.GDSentence_95951Objects2= [];
gdjs.Dream1Code.GDSentence_95951Objects3= [];


gdjs.Dream1Code.asyncCallback15578900 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream1Code.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Sentence_1"), gdjs.Dream1Code.GDSentence_95951Objects2);

{for(var i = 0, len = gdjs.Dream1Code.GDSentence_95951Objects2.length ;i < len;++i) {
    gdjs.Dream1Code.GDSentence_95951Objects2[i].hide();
}
}
gdjs.Dream1Code.localVariables.length = 0;
}
gdjs.Dream1Code.idToCallbackMap.set(15578900, gdjs.Dream1Code.asyncCallback15578900);
gdjs.Dream1Code.eventsList0 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream1Code.localVariables);
for (const obj of gdjs.Dream1Code.GDSentence_95951Objects1) asyncObjectsList.addObject("Sentence_1", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(3), (runtimeScene) => (gdjs.Dream1Code.asyncCallback15578900(runtimeScene, asyncObjectsList)), 15578900, asyncObjectsList);
}
}

}


};gdjs.Dream1Code.mapOfGDgdjs_9546Dream1Code_9546GDUp_95959595ArrowObjects1Objects = Hashtable.newFrom({"Up_Arrow": gdjs.Dream1Code.GDUp_9595ArrowObjects1});
gdjs.Dream1Code.eventsList1 = function(runtimeScene) {

{

gdjs.copyArray(runtimeScene.getObjects("Dark_Light"), gdjs.Dream1Code.GDDark_9595LightObjects2);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream1Code.GDDark_9595LightObjects2.length;i<l;++i) {
    if ( gdjs.Dream1Code.GDDark_9595LightObjects2[i].getBehavior("Animation").getAnimationName() == "Light" ) {
        isConditionTrue_0 = true;
        gdjs.Dream1Code.GDDark_9595LightObjects2[k] = gdjs.Dream1Code.GDDark_9595LightObjects2[i];
        ++k;
    }
}
gdjs.Dream1Code.GDDark_9595LightObjects2.length = k;
if (isConditionTrue_0) {
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
}
if (isConditionTrue_0) {
/* Reuse gdjs.Dream1Code.GDDark_9595LightObjects2 */
gdjs.copyArray(runtimeScene.getObjects("Left_Arrow"), gdjs.Dream1Code.GDLeft_9595ArrowObjects2);
gdjs.copyArray(gdjs.Dream1Code.GDUp_9595ArrowObjects1, gdjs.Dream1Code.GDUp_9595ArrowObjects2);

{for(var i = 0, len = gdjs.Dream1Code.GDUp_9595ArrowObjects2.length ;i < len;++i) {
    gdjs.Dream1Code.GDUp_9595ArrowObjects2[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream1Code.GDDark_9595LightObjects2.length ;i < len;++i) {
    gdjs.Dream1Code.GDDark_9595LightObjects2[i].getBehavior("Animation").setAnimationName("Facing Door");
}
}
{for(var i = 0, len = gdjs.Dream1Code.GDLeft_9595ArrowObjects2.length ;i < len;++i) {
    gdjs.Dream1Code.GDLeft_9595ArrowObjects2[i].hide(false);
}
}
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Dark_Light"), gdjs.Dream1Code.GDDark_9595LightObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream1Code.GDDark_9595LightObjects1.length;i<l;++i) {
    if ( gdjs.Dream1Code.GDDark_9595LightObjects1[i].getBehavior("Animation").getAnimationName() == "Stairs" ) {
        isConditionTrue_0 = true;
        gdjs.Dream1Code.GDDark_9595LightObjects1[k] = gdjs.Dream1Code.GDDark_9595LightObjects1[i];
        ++k;
    }
}
gdjs.Dream1Code.GDDark_9595LightObjects1.length = k;
}
if (isConditionTrue_0) {
/* Reuse gdjs.Dream1Code.GDDark_9595LightObjects1 */
gdjs.copyArray(runtimeScene.getObjects("Right_Arrow"), gdjs.Dream1Code.GDRight_9595ArrowObjects1);
/* Reuse gdjs.Dream1Code.GDUp_9595ArrowObjects1 */
{for(var i = 0, len = gdjs.Dream1Code.GDDark_9595LightObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDDark_9595LightObjects1[i].getBehavior("Animation").setAnimationName("Downstairs");
}
}
{for(var i = 0, len = gdjs.Dream1Code.GDUp_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDUp_9595ArrowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream1Code.GDRight_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDRight_9595ArrowObjects1[i].hide(false);
}
}
}

}


};gdjs.Dream1Code.mapOfGDgdjs_9546Dream1Code_9546GDLeft_95959595ArrowObjects1Objects = Hashtable.newFrom({"Left_Arrow": gdjs.Dream1Code.GDLeft_9595ArrowObjects1});
gdjs.Dream1Code.eventsList2 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {
gdjs.copyArray(runtimeScene.getObjects("Dark_Light"), gdjs.Dream1Code.GDDark_9595LightObjects1);
/* Reuse gdjs.Dream1Code.GDLeft_9595ArrowObjects1 */
gdjs.copyArray(runtimeScene.getObjects("Up_Arrow"), gdjs.Dream1Code.GDUp_9595ArrowObjects1);
{for(var i = 0, len = gdjs.Dream1Code.GDLeft_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDLeft_9595ArrowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream1Code.GDDark_9595LightObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDDark_9595LightObjects1[i].getBehavior("Animation").setAnimationName("Stairs");
}
}
{for(var i = 0, len = gdjs.Dream1Code.GDUp_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDUp_9595ArrowObjects1[i].hide(false);
}
}
}

}


};gdjs.Dream1Code.mapOfGDgdjs_9546Dream1Code_9546GDRight_95959595ArrowObjects1Objects = Hashtable.newFrom({"Right_Arrow": gdjs.Dream1Code.GDRight_9595ArrowObjects1});
gdjs.Dream1Code.eventsList3 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {
{gdjs.evtTools.runtimeScene.replaceScene(runtimeScene, "Dream2", false);
}
}

}


};gdjs.Dream1Code.eventsList4 = function(runtimeScene) {

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
gdjs.copyArray(runtimeScene.getObjects("Left_Arrow"), gdjs.Dream1Code.GDLeft_9595ArrowObjects1);
gdjs.copyArray(runtimeScene.getObjects("Right_Arrow"), gdjs.Dream1Code.GDRight_9595ArrowObjects1);
gdjs.copyArray(runtimeScene.getObjects("Sentence_1"), gdjs.Dream1Code.GDSentence_95951Objects1);
gdjs.copyArray(runtimeScene.getObjects("Up_Arrow"), gdjs.Dream1Code.GDUp_9595ArrowObjects1);
{for(var i = 0, len = gdjs.Dream1Code.GDSentence_95951Objects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDSentence_95951Objects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream1Code.GDUp_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDUp_9595ArrowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream1Code.GDLeft_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDLeft_9595ArrowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream1Code.GDRight_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDRight_9595ArrowObjects1[i].hide();
}
}
{gdjs.evtTools.sound.playMusic(runtimeScene, "creepy-horror-ambience-381940.mp3", true, 100, 1);
}
}

}


{


let isConditionTrue_0 = false;
{
gdjs.copyArray(runtimeScene.getObjects("Letter_Key"), gdjs.Dream1Code.GDLetter_9595KeyObjects1);
{for(var i = 0, len = gdjs.Dream1Code.GDLetter_9595KeyObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDLetter_9595KeyObjects1[i].getBehavior("Animation").setAnimationName("F");
}
}
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Dark_Light"), gdjs.Dream1Code.GDDark_9595LightObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.wasKeyJustPressed(runtimeScene, "f");
if (isConditionTrue_0) {
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream1Code.GDDark_9595LightObjects1.length;i<l;++i) {
    if ( gdjs.Dream1Code.GDDark_9595LightObjects1[i].getBehavior("Animation").getAnimationName() == "Dark" ) {
        isConditionTrue_0 = true;
        gdjs.Dream1Code.GDDark_9595LightObjects1[k] = gdjs.Dream1Code.GDDark_9595LightObjects1[i];
        ++k;
    }
}
gdjs.Dream1Code.GDDark_9595LightObjects1.length = k;
}
if (isConditionTrue_0) {
/* Reuse gdjs.Dream1Code.GDDark_9595LightObjects1 */
gdjs.copyArray(runtimeScene.getObjects("Letter_Key"), gdjs.Dream1Code.GDLetter_9595KeyObjects1);
gdjs.copyArray(runtimeScene.getObjects("Sentence_1"), gdjs.Dream1Code.GDSentence_95951Objects1);
gdjs.copyArray(runtimeScene.getObjects("Up_Arrow"), gdjs.Dream1Code.GDUp_9595ArrowObjects1);
{for(var i = 0, len = gdjs.Dream1Code.GDDark_9595LightObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDDark_9595LightObjects1[i].getBehavior("Animation").setAnimationName("Light");
}
}
{for(var i = 0, len = gdjs.Dream1Code.GDLetter_9595KeyObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDLetter_9595KeyObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream1Code.GDUp_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDUp_9595ArrowObjects1[i].hide(false);
}
}
{gdjs.evtTools.sound.playSound(runtimeScene, "flashlight-clicking-on-105809.mp3", false, 100, 1);
}
{for(var i = 0, len = gdjs.Dream1Code.GDSentence_95951Objects1.length ;i < len;++i) {
    gdjs.Dream1Code.GDSentence_95951Objects1[i].hide(false);
}
}

{ //Subevents
gdjs.Dream1Code.eventsList0(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Up_Arrow"), gdjs.Dream1Code.GDUp_9595ArrowObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.cursorOnObject(gdjs.Dream1Code.mapOfGDgdjs_9546Dream1Code_9546GDUp_95959595ArrowObjects1Objects, runtimeScene, true, false);
if (isConditionTrue_0) {
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream1Code.GDUp_9595ArrowObjects1.length;i<l;++i) {
    if ( gdjs.Dream1Code.GDUp_9595ArrowObjects1[i].isVisible() ) {
        isConditionTrue_0 = true;
        gdjs.Dream1Code.GDUp_9595ArrowObjects1[k] = gdjs.Dream1Code.GDUp_9595ArrowObjects1[i];
        ++k;
    }
}
gdjs.Dream1Code.GDUp_9595ArrowObjects1.length = k;
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream1Code.eventsList1(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Left_Arrow"), gdjs.Dream1Code.GDLeft_9595ArrowObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.cursorOnObject(gdjs.Dream1Code.mapOfGDgdjs_9546Dream1Code_9546GDLeft_95959595ArrowObjects1Objects, runtimeScene, true, false);
if (isConditionTrue_0) {
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream1Code.GDLeft_9595ArrowObjects1.length;i<l;++i) {
    if ( gdjs.Dream1Code.GDLeft_9595ArrowObjects1[i].isVisible() ) {
        isConditionTrue_0 = true;
        gdjs.Dream1Code.GDLeft_9595ArrowObjects1[k] = gdjs.Dream1Code.GDLeft_9595ArrowObjects1[i];
        ++k;
    }
}
gdjs.Dream1Code.GDLeft_9595ArrowObjects1.length = k;
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream1Code.eventsList2(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Right_Arrow"), gdjs.Dream1Code.GDRight_9595ArrowObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.cursorOnObject(gdjs.Dream1Code.mapOfGDgdjs_9546Dream1Code_9546GDRight_95959595ArrowObjects1Objects, runtimeScene, true, false);
if (isConditionTrue_0) {
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream1Code.GDRight_9595ArrowObjects1.length;i<l;++i) {
    if ( gdjs.Dream1Code.GDRight_9595ArrowObjects1[i].isVisible() ) {
        isConditionTrue_0 = true;
        gdjs.Dream1Code.GDRight_9595ArrowObjects1[k] = gdjs.Dream1Code.GDRight_9595ArrowObjects1[i];
        ++k;
    }
}
gdjs.Dream1Code.GDRight_9595ArrowObjects1.length = k;
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream1Code.eventsList3(runtimeScene);} //End of subevents
}

}


};

gdjs.Dream1Code.func = function(runtimeScene) {
runtimeScene.getOnceTriggers().startNewFrame();

gdjs.Dream1Code.GDDark_9595LightObjects1.length = 0;
gdjs.Dream1Code.GDDark_9595LightObjects2.length = 0;
gdjs.Dream1Code.GDDark_9595LightObjects3.length = 0;
gdjs.Dream1Code.GDLetter_9595KeyObjects1.length = 0;
gdjs.Dream1Code.GDLetter_9595KeyObjects2.length = 0;
gdjs.Dream1Code.GDLetter_9595KeyObjects3.length = 0;
gdjs.Dream1Code.GDUp_9595ArrowObjects1.length = 0;
gdjs.Dream1Code.GDUp_9595ArrowObjects2.length = 0;
gdjs.Dream1Code.GDUp_9595ArrowObjects3.length = 0;
gdjs.Dream1Code.GDLeft_9595ArrowObjects1.length = 0;
gdjs.Dream1Code.GDLeft_9595ArrowObjects2.length = 0;
gdjs.Dream1Code.GDLeft_9595ArrowObjects3.length = 0;
gdjs.Dream1Code.GDRight_9595ArrowObjects1.length = 0;
gdjs.Dream1Code.GDRight_9595ArrowObjects2.length = 0;
gdjs.Dream1Code.GDRight_9595ArrowObjects3.length = 0;
gdjs.Dream1Code.GDSentence_95951Objects1.length = 0;
gdjs.Dream1Code.GDSentence_95951Objects2.length = 0;
gdjs.Dream1Code.GDSentence_95951Objects3.length = 0;

gdjs.Dream1Code.eventsList4(runtimeScene);
gdjs.Dream1Code.GDDark_9595LightObjects1.length = 0;
gdjs.Dream1Code.GDDark_9595LightObjects2.length = 0;
gdjs.Dream1Code.GDDark_9595LightObjects3.length = 0;
gdjs.Dream1Code.GDLetter_9595KeyObjects1.length = 0;
gdjs.Dream1Code.GDLetter_9595KeyObjects2.length = 0;
gdjs.Dream1Code.GDLetter_9595KeyObjects3.length = 0;
gdjs.Dream1Code.GDUp_9595ArrowObjects1.length = 0;
gdjs.Dream1Code.GDUp_9595ArrowObjects2.length = 0;
gdjs.Dream1Code.GDUp_9595ArrowObjects3.length = 0;
gdjs.Dream1Code.GDLeft_9595ArrowObjects1.length = 0;
gdjs.Dream1Code.GDLeft_9595ArrowObjects2.length = 0;
gdjs.Dream1Code.GDLeft_9595ArrowObjects3.length = 0;
gdjs.Dream1Code.GDRight_9595ArrowObjects1.length = 0;
gdjs.Dream1Code.GDRight_9595ArrowObjects2.length = 0;
gdjs.Dream1Code.GDRight_9595ArrowObjects3.length = 0;
gdjs.Dream1Code.GDSentence_95951Objects1.length = 0;
gdjs.Dream1Code.GDSentence_95951Objects2.length = 0;
gdjs.Dream1Code.GDSentence_95951Objects3.length = 0;


return;

}

gdjs['Dream1Code'] = gdjs.Dream1Code;
