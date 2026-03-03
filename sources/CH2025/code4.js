gdjs.Bad_32EndingCode = {};
gdjs.Bad_32EndingCode.localVariables = [];
gdjs.Bad_32EndingCode.idToCallbackMap = new Map();
gdjs.Bad_32EndingCode.GDNot_9595On_9595EndingObjects1= [];
gdjs.Bad_32EndingCode.GDNot_9595On_9595EndingObjects2= [];
gdjs.Bad_32EndingCode.GDNot_9595On_9595EndingObjects3= [];
gdjs.Bad_32EndingCode.GDSantaObjects1= [];
gdjs.Bad_32EndingCode.GDSantaObjects2= [];
gdjs.Bad_32EndingCode.GDSantaObjects3= [];
gdjs.Bad_32EndingCode.GDSentence_95953_9595BadObjects1= [];
gdjs.Bad_32EndingCode.GDSentence_95953_9595BadObjects2= [];
gdjs.Bad_32EndingCode.GDSentence_95953_9595BadObjects3= [];


gdjs.Bad_32EndingCode.asyncCallback14043244 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Bad_32EndingCode.localVariables);
{runtimeScene.getGame().getVariables().getFromIndex(0).setBoolean(true);
}
{gdjs.evtTools.runtimeScene.replaceScene(runtimeScene, "Main Menu", false);
}
gdjs.Bad_32EndingCode.localVariables.length = 0;
}
gdjs.Bad_32EndingCode.idToCallbackMap.set(14043244, gdjs.Bad_32EndingCode.asyncCallback14043244);
gdjs.Bad_32EndingCode.eventsList0 = function(runtimeScene, asyncObjectsList) {

{


{
const parentAsyncObjectsList = asyncObjectsList;
{
const asyncObjectsList = gdjs.LongLivedObjectsList.from(parentAsyncObjectsList);
asyncObjectsList.backupLocalVariablesContainers(gdjs.Bad_32EndingCode.localVariables);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(3), (runtimeScene) => (gdjs.Bad_32EndingCode.asyncCallback14043244(runtimeScene, asyncObjectsList)), 14043244, asyncObjectsList);
}
}

}


};gdjs.Bad_32EndingCode.asyncCallback15167596 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Bad_32EndingCode.localVariables);
gdjs.copyArray(runtimeScene.getObjects("Santa"), gdjs.Bad_32EndingCode.GDSantaObjects2);
{for(var i = 0, len = gdjs.Bad_32EndingCode.GDSantaObjects2.length ;i < len;++i) {
    gdjs.Bad_32EndingCode.GDSantaObjects2[i].hide();
}
}

{ //Subevents
gdjs.Bad_32EndingCode.eventsList0(runtimeScene, asyncObjectsList);} //End of subevents
gdjs.Bad_32EndingCode.localVariables.length = 0;
}
gdjs.Bad_32EndingCode.idToCallbackMap.set(15167596, gdjs.Bad_32EndingCode.asyncCallback15167596);
gdjs.Bad_32EndingCode.eventsList1 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Bad_32EndingCode.localVariables);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(5), (runtimeScene) => (gdjs.Bad_32EndingCode.asyncCallback15167596(runtimeScene, asyncObjectsList)), 15167596, asyncObjectsList);
}
}

}


};gdjs.Bad_32EndingCode.eventsList2 = function(runtimeScene) {

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
{gdjs.evtTools.sound.playSound(runtimeScene, "fuzzy-jumpscare-80560.mp3", false, 100, 1);
}

{ //Subevents
gdjs.Bad_32EndingCode.eventsList1(runtimeScene);} //End of subevents
}

}


};

gdjs.Bad_32EndingCode.func = function(runtimeScene) {
runtimeScene.getOnceTriggers().startNewFrame();

gdjs.Bad_32EndingCode.GDNot_9595On_9595EndingObjects1.length = 0;
gdjs.Bad_32EndingCode.GDNot_9595On_9595EndingObjects2.length = 0;
gdjs.Bad_32EndingCode.GDNot_9595On_9595EndingObjects3.length = 0;
gdjs.Bad_32EndingCode.GDSantaObjects1.length = 0;
gdjs.Bad_32EndingCode.GDSantaObjects2.length = 0;
gdjs.Bad_32EndingCode.GDSantaObjects3.length = 0;
gdjs.Bad_32EndingCode.GDSentence_95953_9595BadObjects1.length = 0;
gdjs.Bad_32EndingCode.GDSentence_95953_9595BadObjects2.length = 0;
gdjs.Bad_32EndingCode.GDSentence_95953_9595BadObjects3.length = 0;

gdjs.Bad_32EndingCode.eventsList2(runtimeScene);
gdjs.Bad_32EndingCode.GDNot_9595On_9595EndingObjects1.length = 0;
gdjs.Bad_32EndingCode.GDNot_9595On_9595EndingObjects2.length = 0;
gdjs.Bad_32EndingCode.GDNot_9595On_9595EndingObjects3.length = 0;
gdjs.Bad_32EndingCode.GDSantaObjects1.length = 0;
gdjs.Bad_32EndingCode.GDSantaObjects2.length = 0;
gdjs.Bad_32EndingCode.GDSantaObjects3.length = 0;
gdjs.Bad_32EndingCode.GDSentence_95953_9595BadObjects1.length = 0;
gdjs.Bad_32EndingCode.GDSentence_95953_9595BadObjects2.length = 0;
gdjs.Bad_32EndingCode.GDSentence_95953_9595BadObjects3.length = 0;


return;

}

gdjs['Bad_32EndingCode'] = gdjs.Bad_32EndingCode;
