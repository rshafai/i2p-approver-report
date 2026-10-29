sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Sorter",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
 	  "sap/ui/model/FilterOperator",
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/base/Object",   
    "sap/suite/ui/generic/template/extensionAPI/extensionAPI", 
    "sap/suite/ui/generic/template/lib/CommonEventHandlers"

], function(MessageBox, MessageToast, Sorter, Fragment, JSONModel, Filter, FilterOperator,
            ControllerExtension, BaseObject,ExtensionAPI, CommonEventHandlers) {
    'use strict';
    
    return {
      
        onInit: function(oEvent){
          var oViewModel = new JSONModel({
          });
          this.setModel(oViewModel, "ui");
        },

        autoResize: function(oEvent) {
          //this._onBusyStateChanged();
        },

        onBeforeRebindTableExtension: function(oEvent) {
          let oBindingParams = oEvent.getParameter("bindingParams");
        //   let aSorter = [
        //             new Sorter({
        //                 path: "TopCreateDate",
        //                 descending: true
        //             })
        //   ];
        //   oBindingParams.sorter = aSorter;

          oBindingParams.events = {
            dataReceived: function(oEvent){
                //let aReceivedData = oEvent.getParameter('data').results; // Access parameters
            }.bind(this),
         };
        },
        

        onAfterRendering: function (oEvent) {
          if (!this._oContentTable){
            const name = this.getMetadata().getName();
            const tableNameGrid =  "ca.gc.agr.i2papproverreport::" + name + "::ZQAP_C_I2P_WF_ApproversReport--GridTable";
            const tableNameResp =  "ca.gc.agr.i2papproverreport::" + name + "::ZQAP_C_I2P_WF_ApproversReport--responsiveTable";

            this._oContentTable = this.getView().byId(tableNameResp) || this.getView().byId(tableNameGrid) ;
            if (this.getView().byId(tableNameGrid)){
              //GridTable
              //this._oContentTable.attachBusyStateChanged(this._onBusyStateChanged);
              this._oContentTable.getPlugins()[0].attachSelectionChange(this._onRowSelected.bind(this));
              //Row clickable
              //this._oContentTable.attachCellClick(this._onRowCellClick, this); 
            } else {
              //ResponsiveTable
              this._oContentTable.attachSelectionChange(this._onRowSelected.bind(this));
            }
          }

        },  //override

        _onRowSelected: function( oEvent ){
          this._refreshButtons();
        },

        _onRowCellClick: function (oEvent) {
return;          
          // Prevent execution if they clicked the checkbox column or row header
          var sColumnId = oEvent.getParameter("columnId");
          if (!sColumnId) {
              return;
          }
          var oRowContext = oEvent.getParameter("rowBindingContext");
          if (!oRowContext) {
              return;
          }
          this._navigateExternally(oRowContext);
        },

        _navigateExternally(oRowContext) {
            let oObject = oRowContext.getObject();
            let topWiid = String(oObject.TopWiid).padStart(12, "0");
            let wiid    = String(oObject.TargetWiid).padStart(12, "0");
            
           let oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
           if (oCrossAppNav) {
             oCrossAppNav.toExternal({
               target: {
                 semanticObject: "I2PCheckIn",
                 action: "workflowReport"
               },
               params: {
                 "TopWiid": topWiid, 
                 "Wiid": wiid
               }
             });
           } else {
             console.error("Fiori Launchpad CrossApplicationNavigation service not available.");
           }
        },


        _rebindMainTable: function(){
          this.extensionAPI.rebindTable();
        },

        _onBusyStateChanged: function (oEvent) {
        },


        navigateXcI2p: function(oEvent) {
        },


/*                */
/* Action Buttons */
/*                */
onReserve:function(oEvent){
  this.wfAction("Reserve");
},
onReplace:function(oEvent){
  this.wfAction("Replace");
},
onEscalate:function(oEvent){
  this.wfAction("Escalate");
},

_refreshButtons:function(){
  var aSelectedIndices = this._oContentTable.getPlugins()[0].getSelectedIndices();
  var bCanReserve = (aSelectedIndices.length === 0) ? false : true,
      bCanEscalate = (aSelectedIndices.length === 0) ? false : true,
      bCanReplace = (aSelectedIndices.length === 0) ? false : true;

  aSelectedIndices.forEach(index => {
    let item = this._oContentTable.getContextByIndex(index).getObject();            
    bCanReserve = bCanReserve && !!item.can_reserve;
    bCanReplace = bCanReplace && !!item.can_replace;
    bCanEscalate = bCanEscalate && !!item.can_escalate;
  });
  this.byId("idReserveButton").setEnabled(bCanReserve);
  this.byId("idEscalateButton").setEnabled(bCanEscalate);
  this.byId("idReplaceButton").setEnabled(bCanReplace);
},

_onActionCancel:function(oEvent){
  if (this._confirmDialog){
    this._confirmDialog.then(function(oDialog) {
      oDialog.close();
    });
  }
},

wfAction:function(action){
  var aSelectedIndices = this._oContentTable.getPlugins()[0].getSelectedIndices();
  if (aSelectedIndices.length === 0){
    return;
  }
  var oView = this.getView();
  var oViewModel = this.getModel("ui");
  oViewModel.setProperty("/action", action);
  var aWorkCentres = [];
  var aFilters = [];
  this._sWiid = "";

  // User selection only required for Reserve
  if (!this._confirmDialog) {
    this._confirmDialog = Fragment.load({ id: oView.getId(), name: "ca.gc.agr.i2pcheckinreport.ext.fragment.SelectUser", controller: this
    }).then(function (oDialog) {
      oView.addDependent(oDialog);
      return oDialog;
    });
  }
  this._confirmDialog.then(function(oDialog) {
    var oUsersCombo = this.getView().byId("idUserCombo");
    if (oUsersCombo){
      var oUsers = this.getView().byId("idUserCombo").getBinding("items");
    }
    aSelectedIndices.forEach(index => {
      let item = this._oContentTable.getContextByIndex(index).getObject();
      if( item.WorkCentre !== "00000000" && !aWorkCentres.find( aWorkCentres => aWorkCentres['WorkCentre'] === item.WorkCentre )){
        aWorkCentres.push(item.WorkCentre);
        aFilters.push(new Filter("WorkCentre", FilterOperator.EQ, item.WorkCentre));
      }
      this._sWiid += "|" + (action==="Copy")? item.TopWiid : item.Wiid;  //Dec 2025 - for Copy we need TopWiid
    });
    if (oUsers){
      oUsers.filter( new Filter( aFilters, true) );  // AND = true
    }
    oViewModel.setProperty("/numWorkItems", aSelectedIndices.length);
    oViewModel.setProperty("/numWorkCentres", aWorkCentres.length);
    oDialog.setModel(oView.getModel());
    oDialog.open();
  }.bind(this));
},


_callActionWF: function () {
  var oModel = this.getView().getModel();
  var sUserId = this.getModel("ui").getProperty("/UserId");

  if (!sUserId){
    MessageBox.warning(this.getResourceBundle().getText("invalidUserSelection"));
    return;
  }
  var sAction = this.getModel("ui").getProperty("/action");
  var aSelectedIndices = this._oContentTable.getPlugins()[0].getSelectedIndices();
  if (aSelectedIndices.length > 0 && this._sWiid){ // && sUserId){
      var mParameters = {
        wiid: this._sWiid,
        user_id: sUserId,
        action: sAction
      };
      var oPromise = new Promise(function (resolve, reject) {
        oModel.callFunction("/ActionWF", {
          method: "POST",
          urlParameters: mParameters,
          success: function (oData) {
            resolve(oData);
          },
          error: function (oError) {
            reject(oError);
          }
        });
      });
      this.getView().setBusy(true);
      oPromise.then(function (oData) {
          this.getView().setBusy(false);
          this._sWiid = "";
          this.getView().getDependents()[0].close();
          MessageToast.show(aSelectedIndices.length + " Workflow" + ((aSelectedIndices.length>1)?"s":"") + " successfully actioned");
          this._rebindMainTable();
          
      }.bind(this)).catch(function (oError) {
          this._genericError(oError);
          this.getView().setBusy(false);
      }.bind(this));
    }
},



/*   Common base methods */        
        _genericError:function(oError){
          try {

            var sMessage = "";
            var aErrors = JSON.parse(oError.responseText).error.innererror.errordetails;
            aErrors.forEach(item => {
              sMessage += item.message;
              sMessage += "\n";
            });
            //var sMessage = JSON.parse(oError.responseText).error.message.value;
          } catch (err) {
            sMessage = this.getResourceBundle().getText("@GENERIC_ERROR_MESSAGE");
          }
          MessageBox.error(sMessage);
        },


        getResourceBundle: function (sName) {
          if (!sName) {
            sName = "i18n";
          }
          return this.getOwnerComponent().getModel(sName).getResourceBundle();
        },
        getModel: function (sName) {
          return this.getView().getModel(sName);
        },
        setModel: function (sModel,sName) {
          return this.getView().setModel(sModel,sName);
        },
        getRouter: function () {
          return UIComponent.getRouterFor(this);
        },



      };
  });
