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
debugger;            
          var oViewModel = new JSONModel({
          });
          this.setModel(oViewModel, "ui");
        },

        autoResize: function(oEvent) {
          this._onBusyStateChanged();
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
        onListNavigationExtension: function(oEvent){
        },
        onDataFieldWithIntentBasedNavigation: function (oEvent) {
        },
        
        adaptNavigationParameterExtension: function(oSelectionVariant, oObjectInfo){
            return;
// This does not allow changing semanticObject or action. It only lets you change, add or remove parameters.
// this._oContentTable.getPlugins()[0].getTable().getRows()[0].getBindingContext().getObject()

// oSelectionVariant.getSelectOptionsPropertyNames().forEach(function(sSelectOptionName){
//     if (sSelectOptionName !== 'guid') {
//        oSelectionVariant.removeSelectOption(sSelectOptionName);
//     }
//   });
        },

        onAfterRendering: function (oEvent) {
debugger;
            if (!this._oContentTable){
            const name = this.getMetadata().getName();
            const tableNameGrid =  "ca.gc.agr.i2papproverreport::" + name + "::ZQAP_C_I2P_WF_ApproversReport--GridTable";
            const tableNameResp =  "ca.gc.agr.i2papproverreport::" + name + "::ZQAP_C_I2P_WF_ApproversReport--responsiveTable";
//            ca.gc.agr.i2papproverreport::sap.suite.ui.generic.template.ListReport.view.ListReport::ZQAP_C_I2P_WF_ApproversReport--listReport


            this._oContentTable = this.getView().byId(tableNameResp) || this.getView().byId(tableNameGrid) ;
            if (this.getView().byId(tableNameGrid)){
              //GridTable
              this._oContentTable.attachBusyStateChanged(this._onBusyStateChanged);
              //this._oContentTable.getPlugins()[0].attachSelectionChange(this._onRowSelected.bind(this));

              //Row clickable
              this._oContentTable.attachCellClick(this._onRowCellClick, this); 

            } else {
              //ResponsiveTable
              //this._oContentTable.attachSelectionChange(this._onRowSelected.bind(this));
            }
          }          
        },  //override

        _onRowCellClick: function (oEvent) {
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
        // Trigger standard Fiori Elements navigation via the Navigation Controller API
        //   var oNavigationController = this.extensionAPI.getNavigationController();
        //   oNavigationController.navigateInternal(oRowContext);
        },

        _navigateExternally(oRowContext) {
            let oObject = oRowContext.getObject();
            let topWiid = String(oObject.TopWiid).padStart(12, "0");
            let wiid    = String(oObject.TargetWiid).padStart(12, "0");
            debugger;

          // for local testing only
          //let sUrl =
          //"https://dr1pas01.agr.gc.ca:44318/sap/bc/ui2/flp" +
          //"?sap-client=050&sap-language=EN" +
          //"#I2PCheckIn-workflowReport&/zqap_c_i2p_checkin_report(" +
          //"TopWiid='" + topWiid + "',Wiid='" + wiid + "')";
          //    window.location.href = sUrl;

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
          //this._oContentTable.rebindTable(true);
          this.extensionAPI.rebindTable();
        },

        _onBusyStateChanged: function (oEvent) {
          // Optimize column widths
          var oTable = this._oContentTable;
          var bBusy = false;
          if (oEvent){
            var bBusy = oEvent.getParameter("busy");
            oTable = oEvent.getSource();
          } 
          if (!bBusy && !this._bColumnOptimizationDone) {
            var oTpc = null;
            if (sap.ui.table.TablePointerExtension) {
              oTpc = new sap.ui.table.TablePointerExtension(oTable);
            } else {
              oTpc = new sap.ui.table.extensions.Pointer(oTable);
            }
            var aColumns = oTable.getColumns();
           for (var i = aColumns.length; i >= 0; i--) {
             oTpc.doAutoResizeColumn(i);
             //oTable.autoResizeColumn(i);
           }
              //This line can be commented if you want the columns to be adjusted on every scroll
              //this._bColumnOptimizationDone = true;
          }
        },


        navigateXcI2p: function(oEvent) {
        },



/*   Common base methods */        
        _genericError:function(oError){
          try {
debugger;
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
