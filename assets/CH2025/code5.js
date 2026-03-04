gdjs.Good_32EndingCode = {};
gdjs.Good_32EndingCode.localVariables = [];
gdjs.Good_32EndingCode.idToCallbackMap = new Map();
gdjs.Good_32EndingCode.GDWin_9595with_9595a_9595HObjects1= [];
gdjs.Good_32EndingCode.GDWin_9595with_9595a_9595HObjects2= [];
gdjs.Good_32EndingCode.GDSentence_95953_9595GoodObjects1= [];
gdjs.Good_32EndingCode.GDSentence_95953_9595GoodObjects2= [];


gdjs.Good_32EndingCode.asyncCallback9007020 = function (runtimeScene, asyncObjectsList) {
asyncObjectsList.restoreLocalVariablesContainers(gdjs.Good_32EndingCode.localVariables);
{runtimeScene.getGame().getVariables().getFromIndex(0).setBoolean(true);
}
{gdjs.evtTools.runtimeScene.replaceScene(runtimeScene, "Main Menu", false);
}
gdjs.Good_32EndingCode.localVariables.length = 0;
}
gdjs.Good_32EndingCode.idToCallbackMap.set(9007020, gdjs.Good_32EndingCode.asyncCallback9007020);
gdjs.Good_32EndingCode.eventsList0 = function(runtimeScene) {

{


{
{
const asyncObjectsList = new gdjs.LongLivedObjectsList();
asyncObjectsList.backupLocalVariablesContainers(gdjs.Good_32EndingCode.localVariables);
runtimeScene.getAsyncTasksManager().addTask(gdjs.evtTools.runtimeScene.wait(3), (runtimeScene) => (gdjs.Good_32EndingCode.asyncCallback9007020(runtimeScene, asyncObjectsList)), 9007020, asyncObjectsList);
}
}

}


};gdjs.Good_32EndingCode.eventsList1 = function(runtimeScene) {

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

{ //Subevents
gdjs.Good_32EndingCode.eventsList0(runtimeScene);} //End of subevents
}

}


};

gdjs.Good_32EndingCode.func = function(runtimeScene) {
runtimeScene.getOnceTriggers().startNewFrame();

gdjs.Good_32EndingCode.GDWin_9595with_9595a_9595HObjects1.length = 0;
gdjs.Good_32EndingCode.GDWin_9595with_9595a_9595HObjects2.length = 0;
gdjs.Good_32EndingCode.GDSentence_95953_9595GoodObjects1.length = 0;
gdjs.Good_32EndingCode.GDSentence_95953_9595GoodObjects2.length = 0;

gdjs.Good_32EndingCode.eventsList1(runtimeScene);
gdjs.Good_32EndingCode.GDWin_9595with_9595a_9595HObjects1.length = 0;
gdjs.Good_32EndingCode.GDWin_9595with_9595a_9595HObjects2.length = 0;
gdjs.Good_32EndingCode.GDSentence_95953_9595GoodObjects1.length = 0;
gdjs.Good_32EndingCode.GDSentence_95953_9595GoodObjects2.length = 0;


return;

}

gdjs['Good_32EndingCode'] = gdjs.Good_32EndingCode;
