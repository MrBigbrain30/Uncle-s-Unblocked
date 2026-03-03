gdjs.Dream2Code = {};
gdjs.Dream2Code.localVariables = [];
gdjs.Dream2Code.idToCallbackMap = new Map();
gdjs.Dream2Code.GDLaundryObjects1_1final = [];

gdjs.Dream2Code.GDLaundryObjects1= [];
gdjs.Dream2Code.GDLaundryObjects2= [];
gdjs.Dream2Code.GDLaundryObjects3= [];
gdjs.Dream2Code.GDUp_9595ArrowObjects1= [];
gdjs.Dream2Code.GDUp_9595ArrowObjects2= [];
gdjs.Dream2Code.GDUp_9595ArrowObjects3= [];
gdjs.Dream2Code.GDLeft_9595ArrowObjects1= [];
gdjs.Dream2Code.GDLeft_9595ArrowObjects2= [];
gdjs.Dream2Code.GDLeft_9595ArrowObjects3= [];
gdjs.Dream2Code.GDRight_9595ArrowObjects1= [];
gdjs.Dream2Code.GDRight_9595ArrowObjects2= [];
gdjs.Dream2Code.GDRight_9595ArrowObjects3= [];
gdjs.Dream2Code.GDDream_9595EndObjects1= [];
gdjs.Dream2Code.GDDream_9595EndObjects2= [];
gdjs.Dream2Code.GDDream_9595EndObjects3= [];
gdjs.Dream2Code.GDTorch_9595KeyObjects1= [];
gdjs.Dream2Code.GDTorch_9595KeyObjects2= [];
gdjs.Dream2Code.GDTorch_9595KeyObjects3= [];
gdjs.Dream2Code.GDTorch_9595PickupObjects1= [];
gdjs.Dream2Code.GDTorch_9595PickupObjects2= [];
gdjs.Dream2Code.GDTorch_9595PickupObjects3= [];


gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDUp_95959595ArrowObjects1Objects = Hashtable.newFrom({"Up_Arrow": gdjs.Dream2Code.GDUp_9595ArrowObjects1});
gdjs.Dream2Code.eventsList0 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {
/* Reuse gdjs.Dream2Code.GDLaundryObjects1 */
gdjs.copyArray(runtimeScene.getObjects("Left_Arrow"), gdjs.Dream2Code.GDLeft_9595ArrowObjects1);
gdjs.copyArray(runtimeScene.getObjects("Right_Arrow"), gdjs.Dream2Code.GDRight_9595ArrowObjects1);
/* Reuse gdjs.Dream2Code.GDUp_9595ArrowObjects1 */
{for(var i = 0, len = gdjs.Dream2Code.GDUp_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDUp_9595ArrowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDLeft_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDLeft_9595ArrowObjects1[i].hide(false);
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDRight_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDRight_9595ArrowObjects1[i].hide(false);
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects1[i].getBehavior("Animation").setAnimationName("Front");
}
}
}

}


};gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDRight_95959595ArrowObjects1Objects = Hashtable.newFrom({"Right_Arrow": gdjs.Dream2Code.GDRight_9595ArrowObjects1});
gdjs.Dream2Code.eventsList1 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {
/* Reuse gdjs.Dream2Code.GDLaundryObjects1 */
/* Reuse gdjs.Dream2Code.GDRight_9595ArrowObjects1 */
gdjs.copyArray(runtimeScene.getObjects("Up_Arrow"), gdjs.Dream2Code.GDUp_9595ArrowObjects1);
{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects1[i].getBehavior("Animation").setAnimationName("Right");
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDRight_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDRight_9595ArrowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDUp_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDUp_9595ArrowObjects1[i].hide(false);
}
}
}

}


};gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDUp_95959595ArrowObjects1Objects = Hashtable.newFrom({"Up_Arrow": gdjs.Dream2Code.GDUp_9595ArrowObjects1});
gdjs.Dream2Code.eventsList2 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {
/* Reuse gdjs.Dream2Code.GDLaundryObjects1 */
/* Reuse gdjs.Dream2Code.GDUp_9595ArrowObjects1 */
{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects1[i].getBehavior("Animation").setAnimationName("Paper");
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDUp_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDUp_9595ArrowObjects1[i].hide();
}
}
{runtimeScene.getGame().getVariables().getFromIndex(1).setBoolean(true);
}
}

}


};gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDLeft_95959595ArrowObjects1Objects = Hashtable.newFrom({"Left_Arrow": gdjs.Dream2Code.GDLeft_9595ArrowObjects1});
gdjs.Dream2Code.asyncCallback15627348 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream2Code.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);

gdjs.copyArray(asyncObjectsList.getObjects("Left_Arrow"), gdjs.Dream2Code.GDLeft_9595ArrowObjects2);

gdjs.copyArray(runtimeScene.getObjects("Right_Arrow"), gdjs.Dream2Code.GDRight_9595ArrowObjects2);
gdjs.copyArray(runtimeScene.getObjects("Up_Arrow"), gdjs.Dream2Code.GDUp_9595ArrowObjects2);
{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects2.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").setAnimationName("Front");
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDLeft_9595ArrowObjects2.length ;i < len;++i) {
    gdjs.Dream2Code.GDLeft_9595ArrowObjects2[i].hide(false);
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDRight_9595ArrowObjects2.length ;i < len;++i) {
    gdjs.Dream2Code.GDRight_9595ArrowObjects2[i].hide(false);
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDUp_9595ArrowObjects2.length ;i < len;++i) {
    gdjs.Dream2Code.GDUp_9595ArrowObjects2[i].hide();
}
}
gdjs.Dream2Code.localVariables.length = 0;
}
gdjs.Dream2Code.idToCallbackMap.set(15627348, gdjs.Dream2Code.asyncCallback15627348);
gdjs.Dream2Code.eventsList3 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream2Code.localVariables);
for (const obj of gdjs.Dream2Code.GDLaundryObjects1) asyncObjectsList.addObject("Laundry", obj);
for (const obj of gdjs.Dream2Code.GDLeft_9595ArrowObjects1) asyncObjectsList.addObject("Left_Arrow", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(0.1), (runtimeScene) => (gdjs.Dream2Code.asyncCallback15627348(runtimeScene, asyncObjectsList)), 15627348, asyncObjectsList);
}
}

}


};gdjs.Dream2Code.eventsList4 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList3(runtimeScene);} //End of subevents
}

}


};gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDLeft_95959595ArrowObjects1Objects = Hashtable.newFrom({"Left_Arrow": gdjs.Dream2Code.GDLeft_9595ArrowObjects1});
gdjs.Dream2Code.asyncCallback15628236 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream2Code.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);

gdjs.copyArray(asyncObjectsList.getObjects("Left_Arrow"), gdjs.Dream2Code.GDLeft_9595ArrowObjects2);

gdjs.copyArray(runtimeScene.getObjects("Up_Arrow"), gdjs.Dream2Code.GDUp_9595ArrowObjects2);
{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects2.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").setAnimationName("Right");
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDLeft_9595ArrowObjects2.length ;i < len;++i) {
    gdjs.Dream2Code.GDLeft_9595ArrowObjects2[i].hide(false);
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDUp_9595ArrowObjects2.length ;i < len;++i) {
    gdjs.Dream2Code.GDUp_9595ArrowObjects2[i].hide(false);
}
}
gdjs.Dream2Code.localVariables.length = 0;
}
gdjs.Dream2Code.idToCallbackMap.set(15628236, gdjs.Dream2Code.asyncCallback15628236);
gdjs.Dream2Code.eventsList5 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream2Code.localVariables);
for (const obj of gdjs.Dream2Code.GDLaundryObjects1) asyncObjectsList.addObject("Laundry", obj);
for (const obj of gdjs.Dream2Code.GDLeft_9595ArrowObjects1) asyncObjectsList.addObject("Left_Arrow", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(0.1), (runtimeScene) => (gdjs.Dream2Code.asyncCallback15628236(runtimeScene, asyncObjectsList)), 15628236, asyncObjectsList);
}
}

}


};gdjs.Dream2Code.eventsList6 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList5(runtimeScene);} //End of subevents
}

}


};gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDLeft_95959595ArrowObjects1Objects = Hashtable.newFrom({"Left_Arrow": gdjs.Dream2Code.GDLeft_9595ArrowObjects1});
gdjs.Dream2Code.eventsList7 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {
/* Reuse gdjs.Dream2Code.GDLaundryObjects1 */
/* Reuse gdjs.Dream2Code.GDLeft_9595ArrowObjects1 */
gdjs.copyArray(runtimeScene.getObjects("Right_Arrow"), gdjs.Dream2Code.GDRight_9595ArrowObjects1);
gdjs.copyArray(runtimeScene.getObjects("Up_Arrow"), gdjs.Dream2Code.GDUp_9595ArrowObjects1);
{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects1[i].getBehavior("Animation").setAnimationName("Left");
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDRight_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDRight_9595ArrowObjects1[i].hide(false);
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDUp_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDUp_9595ArrowObjects1[i].hide(false);
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDLeft_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDLeft_9595ArrowObjects1[i].hide();
}
}
}

}


};gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDRight_95959595ArrowObjects1Objects = Hashtable.newFrom({"Right_Arrow": gdjs.Dream2Code.GDRight_9595ArrowObjects1});
gdjs.Dream2Code.asyncCallback15637148 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream2Code.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);

gdjs.copyArray(runtimeScene.getObjects("Left_Arrow"), gdjs.Dream2Code.GDLeft_9595ArrowObjects2);
gdjs.copyArray(runtimeScene.getObjects("Up_Arrow"), gdjs.Dream2Code.GDUp_9595ArrowObjects2);
{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects2.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").setAnimationName("Front");
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDLeft_9595ArrowObjects2.length ;i < len;++i) {
    gdjs.Dream2Code.GDLeft_9595ArrowObjects2[i].hide(false);
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDUp_9595ArrowObjects2.length ;i < len;++i) {
    gdjs.Dream2Code.GDUp_9595ArrowObjects2[i].hide();
}
}
gdjs.Dream2Code.localVariables.length = 0;
}
gdjs.Dream2Code.idToCallbackMap.set(15637148, gdjs.Dream2Code.asyncCallback15637148);
gdjs.Dream2Code.eventsList8 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream2Code.localVariables);
for (const obj of gdjs.Dream2Code.GDLaundryObjects1) asyncObjectsList.addObject("Laundry", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(0.1), (runtimeScene) => (gdjs.Dream2Code.asyncCallback15637148(runtimeScene, asyncObjectsList)), 15637148, asyncObjectsList);
}
}

}


};gdjs.Dream2Code.eventsList9 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList8(runtimeScene);} //End of subevents
}

}


};gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDUp_95959595ArrowObjects1Objects = Hashtable.newFrom({"Up_Arrow": gdjs.Dream2Code.GDUp_9595ArrowObjects1});
gdjs.Dream2Code.asyncCallback15640276 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream2Code.localVariables);
{gdjs.evtTools.sound.playMusic(runtimeScene, "fuzzy-jumpscare-80560.mp3", false, 100, 1);
}
gdjs.Dream2Code.localVariables.length = 0;
}
gdjs.Dream2Code.idToCallbackMap.set(15640276, gdjs.Dream2Code.asyncCallback15640276);
gdjs.Dream2Code.eventsList10 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream2Code.localVariables);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(2), (runtimeScene) => (gdjs.Dream2Code.asyncCallback15640276(runtimeScene, asyncObjectsList)), 15640276, asyncObjectsList);
}
}

}


};gdjs.Dream2Code.eventsList11 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {
/* Reuse gdjs.Dream2Code.GDDream_9595EndObjects1 */
/* Reuse gdjs.Dream2Code.GDLaundryObjects1 */
gdjs.copyArray(runtimeScene.getObjects("Left_Arrow"), gdjs.Dream2Code.GDLeft_9595ArrowObjects1);
gdjs.copyArray(runtimeScene.getObjects("Right_Arrow"), gdjs.Dream2Code.GDRight_9595ArrowObjects1);
gdjs.copyArray(runtimeScene.getObjects("Torch_Key"), gdjs.Dream2Code.GDTorch_9595KeyObjects1);
/* Reuse gdjs.Dream2Code.GDUp_9595ArrowObjects1 */
{for(var i = 0, len = gdjs.Dream2Code.GDUp_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDUp_9595ArrowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDLeft_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDLeft_9595ArrowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDRight_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDRight_9595ArrowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDTorch_9595KeyObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDTorch_9595KeyObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDDream_9595EndObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDDream_9595EndObjects1[i].play();
}
}
{gdjs.evtTools.sound.unloadMusic(runtimeScene, "creepy-horror-ambience-381940.mp3");
}

{ //Subevents
gdjs.Dream2Code.eventsList10(runtimeScene);} //End of subevents
}

}


};gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDTorch_95959595PickupObjects1Objects = Hashtable.newFrom({"Torch_Pickup": gdjs.Dream2Code.GDTorch_9595PickupObjects1});
gdjs.Dream2Code.eventsList12 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {
/* Reuse gdjs.Dream2Code.GDLaundryObjects1 */
gdjs.copyArray(runtimeScene.getObjects("Torch_Key"), gdjs.Dream2Code.GDTorch_9595KeyObjects1);
/* Reuse gdjs.Dream2Code.GDTorch_9595PickupObjects1 */
{for(var i = 0, len = gdjs.Dream2Code.GDTorch_9595KeyObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDTorch_9595KeyObjects1[i].hide(false);
}
}
{runtimeScene.getScene().getVariables().getFromIndex(0).setBoolean(true);
}
{for(var i = 0, len = gdjs.Dream2Code.GDTorch_9595PickupObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDTorch_9595PickupObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects1[i].getBehavior("Animation").setAnimationName("Front");
}
}
}

}


};gdjs.Dream2Code.asyncCallback15645132 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream2Code.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects3);

{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects3.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects3[i].getBehavior("Animation").setAnimationName("Blue Front");
}
}
{gdjs.evtTools.sound.playSound(runtimeScene, "flashlight-clicking-on-105809.mp3", false, 100, 1);
}
gdjs.Dream2Code.localVariables.length = 0;
}
gdjs.Dream2Code.idToCallbackMap.set(15645132, gdjs.Dream2Code.asyncCallback15645132);
gdjs.Dream2Code.eventsList13 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream2Code.localVariables);
for (const obj of gdjs.Dream2Code.GDLaundryObjects2) asyncObjectsList.addObject("Laundry", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(0.1), (runtimeScene) => (gdjs.Dream2Code.asyncCallback15645132(runtimeScene, asyncObjectsList)), 15645132, asyncObjectsList);
}
}

}


};gdjs.Dream2Code.asyncCallback15645972 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream2Code.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects3);

{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects3.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects3[i].getBehavior("Animation").setAnimationName("Blue Right");
}
}
{gdjs.evtTools.sound.playSound(runtimeScene, "flashlight-clicking-on-105809.mp3", false, 100, 1);
}
gdjs.Dream2Code.localVariables.length = 0;
}
gdjs.Dream2Code.idToCallbackMap.set(15645972, gdjs.Dream2Code.asyncCallback15645972);
gdjs.Dream2Code.eventsList14 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream2Code.localVariables);
for (const obj of gdjs.Dream2Code.GDLaundryObjects2) asyncObjectsList.addObject("Laundry", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(0.1), (runtimeScene) => (gdjs.Dream2Code.asyncCallback15645972(runtimeScene, asyncObjectsList)), 15645972, asyncObjectsList);
}
}

}


};gdjs.Dream2Code.asyncCallback15647492 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream2Code.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects3);

{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects3.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects3[i].getBehavior("Animation").setAnimationName("Blue Left");
}
}
{gdjs.evtTools.sound.playSound(runtimeScene, "flashlight-clicking-on-105809.mp3", false, 100, 1);
}
gdjs.Dream2Code.localVariables.length = 0;
}
gdjs.Dream2Code.idToCallbackMap.set(15647492, gdjs.Dream2Code.asyncCallback15647492);
gdjs.Dream2Code.eventsList15 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream2Code.localVariables);
for (const obj of gdjs.Dream2Code.GDLaundryObjects2) asyncObjectsList.addObject("Laundry", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(0.1), (runtimeScene) => (gdjs.Dream2Code.asyncCallback15647492(runtimeScene, asyncObjectsList)), 15647492, asyncObjectsList);
}
}

}


};gdjs.Dream2Code.asyncCallback15648748 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream2Code.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects3);

{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects3.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects3[i].getBehavior("Animation").setAnimationName("Blue Paper");
}
}
{gdjs.evtTools.sound.playSound(runtimeScene, "flashlight-clicking-on-105809.mp3", false, 100, 1);
}
gdjs.Dream2Code.localVariables.length = 0;
}
gdjs.Dream2Code.idToCallbackMap.set(15648748, gdjs.Dream2Code.asyncCallback15648748);
gdjs.Dream2Code.eventsList16 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream2Code.localVariables);
for (const obj of gdjs.Dream2Code.GDLaundryObjects2) asyncObjectsList.addObject("Laundry", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(0.1), (runtimeScene) => (gdjs.Dream2Code.asyncCallback15648748(runtimeScene, asyncObjectsList)), 15648748, asyncObjectsList);
}
}

}


};gdjs.Dream2Code.asyncCallback15649916 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream2Code.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects3);

{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects3.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects3[i].getBehavior("Animation").setAnimationName("Front");
}
}
{gdjs.evtTools.sound.playSound(runtimeScene, "flashlight-clicking-on-105809.mp3", false, 100, 1);
}
gdjs.Dream2Code.localVariables.length = 0;
}
gdjs.Dream2Code.idToCallbackMap.set(15649916, gdjs.Dream2Code.asyncCallback15649916);
gdjs.Dream2Code.eventsList17 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream2Code.localVariables);
for (const obj of gdjs.Dream2Code.GDLaundryObjects2) asyncObjectsList.addObject("Laundry", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(0.1), (runtimeScene) => (gdjs.Dream2Code.asyncCallback15649916(runtimeScene, asyncObjectsList)), 15649916, asyncObjectsList);
}
}

}


};gdjs.Dream2Code.asyncCallback15651076 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream2Code.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects3);

{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects3.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects3[i].getBehavior("Animation").setAnimationName("Right");
}
}
{gdjs.evtTools.sound.playSound(runtimeScene, "flashlight-clicking-on-105809.mp3", false, 100, 1);
}
gdjs.Dream2Code.localVariables.length = 0;
}
gdjs.Dream2Code.idToCallbackMap.set(15651076, gdjs.Dream2Code.asyncCallback15651076);
gdjs.Dream2Code.eventsList18 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream2Code.localVariables);
for (const obj of gdjs.Dream2Code.GDLaundryObjects2) asyncObjectsList.addObject("Laundry", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(0.1), (runtimeScene) => (gdjs.Dream2Code.asyncCallback15651076(runtimeScene, asyncObjectsList)), 15651076, asyncObjectsList);
}
}

}


};gdjs.Dream2Code.asyncCallback15652244 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream2Code.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects3);

{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects3.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects3[i].getBehavior("Animation").setAnimationName("Left");
}
}
{gdjs.evtTools.sound.playSound(runtimeScene, "flashlight-clicking-on-105809.mp3", false, 100, 1);
}
gdjs.Dream2Code.localVariables.length = 0;
}
gdjs.Dream2Code.idToCallbackMap.set(15652244, gdjs.Dream2Code.asyncCallback15652244);
gdjs.Dream2Code.eventsList19 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream2Code.localVariables);
for (const obj of gdjs.Dream2Code.GDLaundryObjects2) asyncObjectsList.addObject("Laundry", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(0.1), (runtimeScene) => (gdjs.Dream2Code.asyncCallback15652244(runtimeScene, asyncObjectsList)), 15652244, asyncObjectsList);
}
}

}


};gdjs.Dream2Code.asyncCallback15653420 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Dream2Code.localVariables);
gdjs.copyArray(asyncObjectsList.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);

{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects2.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").setAnimationName("Paper");
}
}
{gdjs.evtTools.sound.playSound(runtimeScene, "flashlight-clicking-on-105809.mp3", false, 100, 1);
}
gdjs.Dream2Code.localVariables.length = 0;
}
gdjs.Dream2Code.idToCallbackMap.set(15653420, gdjs.Dream2Code.asyncCallback15653420);
gdjs.Dream2Code.eventsList20 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Dream2Code.localVariables);
for (const obj of gdjs.Dream2Code.GDLaundryObjects1) asyncObjectsList.addObject("Laundry", obj);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(0.1), (runtimeScene) => (gdjs.Dream2Code.asyncCallback15653420(runtimeScene, asyncObjectsList)), 15653420, asyncObjectsList);
}
}

}


};gdjs.Dream2Code.eventsList21 = function(runtimeScene) {

{

gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Front" ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList13(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Right" ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList14(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Left" ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList15(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Paper" ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList16(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Blue Front" ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList17(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Blue Right" ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList18(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Blue Left" ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList19(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects1.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects1[i].getBehavior("Animation").getAnimationName() == "Blue Paper" ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDLaundryObjects1[k] = gdjs.Dream2Code.GDLaundryObjects1[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects1.length = k;
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList20(runtimeScene);} //End of subevents
}

}


};gdjs.Dream2Code.eventsList22 = function(runtimeScene) {

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
gdjs.copyArray(runtimeScene.getObjects("Left_Arrow"), gdjs.Dream2Code.GDLeft_9595ArrowObjects1);
gdjs.copyArray(runtimeScene.getObjects("Right_Arrow"), gdjs.Dream2Code.GDRight_9595ArrowObjects1);
gdjs.copyArray(runtimeScene.getObjects("Torch_Key"), gdjs.Dream2Code.GDTorch_9595KeyObjects1);
gdjs.copyArray(runtimeScene.getObjects("Torch_Pickup"), gdjs.Dream2Code.GDTorch_9595PickupObjects1);
{for(var i = 0, len = gdjs.Dream2Code.GDLeft_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDLeft_9595ArrowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDRight_9595ArrowObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDRight_9595ArrowObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDTorch_9595KeyObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDTorch_9595KeyObjects1[i].hide();
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDTorch_9595PickupObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDTorch_9595PickupObjects1[i].hide();
}
}
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects1);
gdjs.copyArray(runtimeScene.getObjects("Up_Arrow"), gdjs.Dream2Code.GDUp_9595ArrowObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.cursorOnObject(gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDUp_95959595ArrowObjects1Objects, runtimeScene, true, false);
if (isConditionTrue_0) {
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects1.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects1[i].getBehavior("Animation").getAnimationName() == "Back" ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDLaundryObjects1[k] = gdjs.Dream2Code.GDLaundryObjects1[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects1.length = k;
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList0(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Right_Arrow"), gdjs.Dream2Code.GDRight_9595ArrowObjects1);
gdjs.Dream2Code.GDLaundryObjects1.length = 0;


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.cursorOnObject(gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDRight_95959595ArrowObjects1Objects, runtimeScene, true, false);
if (isConditionTrue_0) {
isConditionTrue_0 = false;
{gdjs.Dream2Code.GDLaundryObjects1_1final.length = 0;
let isConditionTrue_1 = false;
isConditionTrue_0 = false;
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Front" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Front Torch" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Blue Front" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(gdjs.Dream2Code.GDLaundryObjects1_1final, gdjs.Dream2Code.GDLaundryObjects1);
}
}
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList1(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Up_Arrow"), gdjs.Dream2Code.GDUp_9595ArrowObjects1);
gdjs.Dream2Code.GDLaundryObjects1.length = 0;


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.cursorOnObject(gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDUp_95959595ArrowObjects1Objects, runtimeScene, true, false);
if (isConditionTrue_0) {
isConditionTrue_0 = false;
{gdjs.Dream2Code.GDLaundryObjects1_1final.length = 0;
let isConditionTrue_1 = false;
isConditionTrue_0 = false;
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Right" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Blue Right" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(gdjs.Dream2Code.GDLaundryObjects1_1final, gdjs.Dream2Code.GDLaundryObjects1);
}
}
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList2(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Left_Arrow"), gdjs.Dream2Code.GDLeft_9595ArrowObjects1);
gdjs.Dream2Code.GDLaundryObjects1.length = 0;


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
{gdjs.Dream2Code.GDLaundryObjects1_1final.length = 0;
let isConditionTrue_1 = false;
isConditionTrue_0 = false;
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Right" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Blue Right" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(gdjs.Dream2Code.GDLaundryObjects1_1final, gdjs.Dream2Code.GDLaundryObjects1);
}
}
if (isConditionTrue_0) {
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.cursorOnObject(gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDLeft_95959595ArrowObjects1Objects, runtimeScene, true, false);
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList4(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Left_Arrow"), gdjs.Dream2Code.GDLeft_9595ArrowObjects1);
gdjs.Dream2Code.GDLaundryObjects1.length = 0;


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.cursorOnObject(gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDLeft_95959595ArrowObjects1Objects, runtimeScene, true, false);
if (isConditionTrue_0) {
isConditionTrue_0 = false;
{gdjs.Dream2Code.GDLaundryObjects1_1final.length = 0;
let isConditionTrue_1 = false;
isConditionTrue_0 = false;
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Paper" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Blue Paper" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(gdjs.Dream2Code.GDLaundryObjects1_1final, gdjs.Dream2Code.GDLaundryObjects1);
}
}
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList6(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects1.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects1[i].getBehavior("Animation").getAnimationName() == "Front" ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDLaundryObjects1[k] = gdjs.Dream2Code.GDLaundryObjects1[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects1.length = k;
if (isConditionTrue_0) {
isConditionTrue_0 = false;
{let isConditionTrue_1 = false;
isConditionTrue_1 = false;
{isConditionTrue_1 = runtimeScene.getGame().getVariables().getFromIndex(0).getAsBoolean();
}
if (isConditionTrue_1) {
isConditionTrue_1 = false;
{isConditionTrue_1 = runtimeScene.getGame().getVariables().getFromIndex(1).getAsBoolean();
}
if (isConditionTrue_1) {
isConditionTrue_1 = false;
{isConditionTrue_1 = !runtimeScene.getScene().getVariables().getFromIndex(0).getAsBoolean();
}
}
}
isConditionTrue_0 = isConditionTrue_1;
}
}
if (isConditionTrue_0) {
/* Reuse gdjs.Dream2Code.GDLaundryObjects1 */
gdjs.copyArray(runtimeScene.getObjects("Torch_Pickup"), gdjs.Dream2Code.GDTorch_9595PickupObjects1);
{for(var i = 0, len = gdjs.Dream2Code.GDLaundryObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDLaundryObjects1[i].getBehavior("Animation").setAnimationName("Front Torch");
}
}
{for(var i = 0, len = gdjs.Dream2Code.GDTorch_9595PickupObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDTorch_9595PickupObjects1[i].hide(false);
}
}
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Left_Arrow"), gdjs.Dream2Code.GDLeft_9595ArrowObjects1);
gdjs.Dream2Code.GDLaundryObjects1.length = 0;


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.cursorOnObject(gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDLeft_95959595ArrowObjects1Objects, runtimeScene, true, false);
if (isConditionTrue_0) {
isConditionTrue_0 = false;
{gdjs.Dream2Code.GDLaundryObjects1_1final.length = 0;
let isConditionTrue_1 = false;
isConditionTrue_0 = false;
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Front" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Front Torch" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Blue Front" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(gdjs.Dream2Code.GDLaundryObjects1_1final, gdjs.Dream2Code.GDLaundryObjects1);
}
}
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList7(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Right_Arrow"), gdjs.Dream2Code.GDRight_9595ArrowObjects1);
gdjs.Dream2Code.GDLaundryObjects1.length = 0;


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.cursorOnObject(gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDRight_95959595ArrowObjects1Objects, runtimeScene, true, false);
if (isConditionTrue_0) {
isConditionTrue_0 = false;
{gdjs.Dream2Code.GDLaundryObjects1_1final.length = 0;
let isConditionTrue_1 = false;
isConditionTrue_0 = false;
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Left" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Blue Left" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(gdjs.Dream2Code.GDLaundryObjects1_1final, gdjs.Dream2Code.GDLaundryObjects1);
}
}
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList9(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Dream_End"), gdjs.Dream2Code.GDDream_9595EndObjects1);
gdjs.copyArray(runtimeScene.getObjects("Up_Arrow"), gdjs.Dream2Code.GDUp_9595ArrowObjects1);
gdjs.Dream2Code.GDLaundryObjects1.length = 0;


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.cursorOnObject(gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDUp_95959595ArrowObjects1Objects, runtimeScene, true, false);
if (isConditionTrue_0) {
isConditionTrue_0 = false;
{gdjs.Dream2Code.GDLaundryObjects1_1final.length = 0;
let isConditionTrue_1 = false;
isConditionTrue_0 = false;
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Left" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects2);
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects2.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects2[i].getBehavior("Animation").getAnimationName() == "Blue Left" ) {
        isConditionTrue_1 = true;
        gdjs.Dream2Code.GDLaundryObjects2[k] = gdjs.Dream2Code.GDLaundryObjects2[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects2.length = k;
if(isConditionTrue_1) {
    isConditionTrue_0 = true;
    for (let j = 0, jLen = gdjs.Dream2Code.GDLaundryObjects2.length; j < jLen ; ++j) {
        if ( gdjs.Dream2Code.GDLaundryObjects1_1final.indexOf(gdjs.Dream2Code.GDLaundryObjects2[j]) === -1 )
            gdjs.Dream2Code.GDLaundryObjects1_1final.push(gdjs.Dream2Code.GDLaundryObjects2[j]);
    }
}
}
{
gdjs.copyArray(gdjs.Dream2Code.GDLaundryObjects1_1final, gdjs.Dream2Code.GDLaundryObjects1);
}
}
if (isConditionTrue_0) {
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDDream_9595EndObjects1.length;i<l;++i) {
    if ( !(gdjs.Dream2Code.GDDream_9595EndObjects1[i].isPlayed()) ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDDream_9595EndObjects1[k] = gdjs.Dream2Code.GDDream_9595EndObjects1[i];
        ++k;
    }
}
gdjs.Dream2Code.GDDream_9595EndObjects1.length = k;
}
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList11(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Dream_End"), gdjs.Dream2Code.GDDream_9595EndObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDDream_9595EndObjects1.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDDream_9595EndObjects1[i].isEnded() ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDDream_9595EndObjects1[k] = gdjs.Dream2Code.GDDream_9595EndObjects1[i];
        ++k;
    }
}
gdjs.Dream2Code.GDDream_9595EndObjects1.length = k;
if (isConditionTrue_0) {
{gdjs.evtTools.runtimeScene.replaceScene(runtimeScene, "House", false);
}
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects1);
gdjs.copyArray(runtimeScene.getObjects("Torch_Pickup"), gdjs.Dream2Code.GDTorch_9595PickupObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects1.length;i<l;++i) {
    if ( gdjs.Dream2Code.GDLaundryObjects1[i].getBehavior("Animation").getAnimationName() == "Front Torch" ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDLaundryObjects1[k] = gdjs.Dream2Code.GDLaundryObjects1[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects1.length = k;
if (isConditionTrue_0) {
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.cursorOnObject(gdjs.Dream2Code.mapOfGDgdjs_9546Dream2Code_9546GDTorch_95959595PickupObjects1Objects, runtimeScene, true, false);
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList12(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Laundry"), gdjs.Dream2Code.GDLaundryObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Dream2Code.GDLaundryObjects1.length;i<l;++i) {
    if ( !(gdjs.Dream2Code.GDLaundryObjects1[i].getBehavior("Animation").getAnimationName() == "Front Torch") ) {
        isConditionTrue_0 = true;
        gdjs.Dream2Code.GDLaundryObjects1[k] = gdjs.Dream2Code.GDLaundryObjects1[i];
        ++k;
    }
}
gdjs.Dream2Code.GDLaundryObjects1.length = k;
if (isConditionTrue_0) {
gdjs.copyArray(runtimeScene.getObjects("Torch_Pickup"), gdjs.Dream2Code.GDTorch_9595PickupObjects1);
{for(var i = 0, len = gdjs.Dream2Code.GDTorch_9595PickupObjects1.length ;i < len;++i) {
    gdjs.Dream2Code.GDTorch_9595PickupObjects1[i].hide();
}
}
}

}


{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
{isConditionTrue_0 = runtimeScene.getScene().getVariables().getFromIndex(0).getAsBoolean();
}
if (isConditionTrue_0) {
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.wasKeyJustPressed(runtimeScene, "f");
}
if (isConditionTrue_0) {

{ //Subevents
gdjs.Dream2Code.eventsList21(runtimeScene);} //End of subevents
}

}


};

gdjs.Dream2Code.func = function(runtimeScene) {
runtimeScene.getOnceTriggers().startNewFrame();

gdjs.Dream2Code.GDLaundryObjects1.length = 0;
gdjs.Dream2Code.GDLaundryObjects2.length = 0;
gdjs.Dream2Code.GDLaundryObjects3.length = 0;
gdjs.Dream2Code.GDUp_9595ArrowObjects1.length = 0;
gdjs.Dream2Code.GDUp_9595ArrowObjects2.length = 0;
gdjs.Dream2Code.GDUp_9595ArrowObjects3.length = 0;
gdjs.Dream2Code.GDLeft_9595ArrowObjects1.length = 0;
gdjs.Dream2Code.GDLeft_9595ArrowObjects2.length = 0;
gdjs.Dream2Code.GDLeft_9595ArrowObjects3.length = 0;
gdjs.Dream2Code.GDRight_9595ArrowObjects1.length = 0;
gdjs.Dream2Code.GDRight_9595ArrowObjects2.length = 0;
gdjs.Dream2Code.GDRight_9595ArrowObjects3.length = 0;
gdjs.Dream2Code.GDDream_9595EndObjects1.length = 0;
gdjs.Dream2Code.GDDream_9595EndObjects2.length = 0;
gdjs.Dream2Code.GDDream_9595EndObjects3.length = 0;
gdjs.Dream2Code.GDTorch_9595KeyObjects1.length = 0;
gdjs.Dream2Code.GDTorch_9595KeyObjects2.length = 0;
gdjs.Dream2Code.GDTorch_9595KeyObjects3.length = 0;
gdjs.Dream2Code.GDTorch_9595PickupObjects1.length = 0;
gdjs.Dream2Code.GDTorch_9595PickupObjects2.length = 0;
gdjs.Dream2Code.GDTorch_9595PickupObjects3.length = 0;

gdjs.Dream2Code.eventsList22(runtimeScene);
gdjs.Dream2Code.GDLaundryObjects1.length = 0;
gdjs.Dream2Code.GDLaundryObjects2.length = 0;
gdjs.Dream2Code.GDLaundryObjects3.length = 0;
gdjs.Dream2Code.GDUp_9595ArrowObjects1.length = 0;
gdjs.Dream2Code.GDUp_9595ArrowObjects2.length = 0;
gdjs.Dream2Code.GDUp_9595ArrowObjects3.length = 0;
gdjs.Dream2Code.GDLeft_9595ArrowObjects1.length = 0;
gdjs.Dream2Code.GDLeft_9595ArrowObjects2.length = 0;
gdjs.Dream2Code.GDLeft_9595ArrowObjects3.length = 0;
gdjs.Dream2Code.GDRight_9595ArrowObjects1.length = 0;
gdjs.Dream2Code.GDRight_9595ArrowObjects2.length = 0;
gdjs.Dream2Code.GDRight_9595ArrowObjects3.length = 0;
gdjs.Dream2Code.GDDream_9595EndObjects1.length = 0;
gdjs.Dream2Code.GDDream_9595EndObjects2.length = 0;
gdjs.Dream2Code.GDDream_9595EndObjects3.length = 0;
gdjs.Dream2Code.GDTorch_9595KeyObjects1.length = 0;
gdjs.Dream2Code.GDTorch_9595KeyObjects2.length = 0;
gdjs.Dream2Code.GDTorch_9595KeyObjects3.length = 0;
gdjs.Dream2Code.GDTorch_9595PickupObjects1.length = 0;
gdjs.Dream2Code.GDTorch_9595PickupObjects2.length = 0;
gdjs.Dream2Code.GDTorch_9595PickupObjects3.length = 0;


return;

}

gdjs['Dream2Code'] = gdjs.Dream2Code;
