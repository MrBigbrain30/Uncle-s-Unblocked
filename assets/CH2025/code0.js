gdjs.Main_32MenuCode = {};
gdjs.Main_32MenuCode.localVariables = [];
gdjs.Main_32MenuCode.idToCallbackMap = new Map();
gdjs.Main_32MenuCode.GDPlay_9595ButtonObjects1= [];
gdjs.Main_32MenuCode.GDPlay_9595ButtonObjects2= [];
gdjs.Main_32MenuCode.GDTitleObjects1= [];
gdjs.Main_32MenuCode.GDTitleObjects2= [];
gdjs.Main_32MenuCode.GDQuit_9595ButtonObjects1= [];
gdjs.Main_32MenuCode.GDQuit_9595ButtonObjects2= [];
gdjs.Main_32MenuCode.GDBackgroundObjects1= [];
gdjs.Main_32MenuCode.GDBackgroundObjects2= [];


gdjs.Main_32MenuCode.eventsList0 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {
{gdjs.evtTools.runtimeScene.replaceScene(runtimeScene, "Dream1", false);
}
}

}


};gdjs.Main_32MenuCode.eventsList1 = function(runtimeScene) {

{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.input.isMouseButtonPressed(runtimeScene, "Left");
if (isConditionTrue_0) {
{gdjs.evtTools.runtimeScene.stopGame(runtimeScene);
}
}

}


};gdjs.Main_32MenuCode.eventsList2 = function(runtimeScene) {

{

gdjs.copyArray(runtimeScene.getObjects("Play_Button"), gdjs.Main_32MenuCode.GDPlay_9595ButtonObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Main_32MenuCode.GDPlay_9595ButtonObjects1.length;i<l;++i) {
    if ( gdjs.Main_32MenuCode.GDPlay_9595ButtonObjects1[i].IsHovered(null) ) {
        isConditionTrue_0 = true;
        gdjs.Main_32MenuCode.GDPlay_9595ButtonObjects1[k] = gdjs.Main_32MenuCode.GDPlay_9595ButtonObjects1[i];
        ++k;
    }
}
gdjs.Main_32MenuCode.GDPlay_9595ButtonObjects1.length = k;
if (isConditionTrue_0) {

{ //Subevents
gdjs.Main_32MenuCode.eventsList0(runtimeScene);} //End of subevents
}

}


{

gdjs.copyArray(runtimeScene.getObjects("Quit_Button"), gdjs.Main_32MenuCode.GDQuit_9595ButtonObjects1);

let isConditionTrue_0 = false;
isConditionTrue_0 = false;
for (var i = 0, k = 0, l = gdjs.Main_32MenuCode.GDQuit_9595ButtonObjects1.length;i<l;++i) {
    if ( gdjs.Main_32MenuCode.GDQuit_9595ButtonObjects1[i].IsHovered(null) ) {
        isConditionTrue_0 = true;
        gdjs.Main_32MenuCode.GDQuit_9595ButtonObjects1[k] = gdjs.Main_32MenuCode.GDQuit_9595ButtonObjects1[i];
        ++k;
    }
}
gdjs.Main_32MenuCode.GDQuit_9595ButtonObjects1.length = k;
if (isConditionTrue_0) {

{ //Subevents
gdjs.Main_32MenuCode.eventsList1(runtimeScene);} //End of subevents
}

}


{


let isConditionTrue_0 = false;
isConditionTrue_0 = false;
isConditionTrue_0 = gdjs.evtTools.runtimeScene.sceneJustBegins(runtimeScene);
if (isConditionTrue_0) {
{gdjs.evtTools.window.setFullScreen(runtimeScene, true, true);
}
{gdjs.evtTools.advancedWindow.setFullScreenable(true, runtimeScene);
}
}

}


};

gdjs.Main_32MenuCode.func = function(runtimeScene) {
runtimeScene.getOnceTriggers().startNewFrame();

gdjs.Main_32MenuCode.GDPlay_9595ButtonObjects1.length = 0;
gdjs.Main_32MenuCode.GDPlay_9595ButtonObjects2.length = 0;
gdjs.Main_32MenuCode.GDTitleObjects1.length = 0;
gdjs.Main_32MenuCode.GDTitleObjects2.length = 0;
gdjs.Main_32MenuCode.GDQuit_9595ButtonObjects1.length = 0;
gdjs.Main_32MenuCode.GDQuit_9595ButtonObjects2.length = 0;
gdjs.Main_32MenuCode.GDBackgroundObjects1.length = 0;
gdjs.Main_32MenuCode.GDBackgroundObjects2.length = 0;

gdjs.Main_32MenuCode.eventsList2(runtimeScene);
gdjs.Main_32MenuCode.GDPlay_9595ButtonObjects1.length = 0;
gdjs.Main_32MenuCode.GDPlay_9595ButtonObjects2.length = 0;
gdjs.Main_32MenuCode.GDTitleObjects1.length = 0;
gdjs.Main_32MenuCode.GDTitleObjects2.length = 0;
gdjs.Main_32MenuCode.GDQuit_9595ButtonObjects1.length = 0;
gdjs.Main_32MenuCode.GDQuit_9595ButtonObjects2.length = 0;
gdjs.Main_32MenuCode.GDBackgroundObjects1.length = 0;
gdjs.Main_32MenuCode.GDBackgroundObjects2.length = 0;


return;

}

gdjs['Main_32MenuCode'] = gdjs.Main_32MenuCode;
