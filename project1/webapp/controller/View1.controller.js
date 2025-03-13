sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "sap/ui/model/json/JSONModel",
    "sap/m/ColumnListItem",
    "sap/m/Label",
    "sap/m/Text",
    "sap/ui/table/Table",
    "sap/ui/table/Column",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, ValueHelpDialog, JSONModel, Label, Text, Table, Column, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        _oSearchModel: null,
        onInit() {
        },
        onAfterRendering() {
            //Set the model for the ValueHelpDialog
            this._oSearchModel = new JSONModel();
            var oModel = this.getView().getModel();
            var sPath = "/BSEG_TABSet";
            oModel.read(sPath, {
                success: (oData) => {
                    this._oSearchModel.setData(oData.results);
                },
                error: (oError) => {
                    console.error("Error fetching data: ", oError);
                }
            });
        },
        onPress(oEvent) {
            const oItem = oEvent.getParameter("listItem") || oEvent.getSource();
            const oContext = oItem.getBindingContext();
            const sBukrs = oContext.getProperty("Bukrs");
            const sGjahr = oContext.getProperty("Gjahr");
            const sBelnr = oContext.getProperty("Belnr");

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Detail", {objectId: sBukrs + "-" + sGjahr + "-" + sBelnr });
        },
        onValueHelpRequestFilter: function (oEvent) {
            var oView = this.getView();
            var oInput = oEvent.getSource();

            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = new ValueHelpDialog({
                    title: "Select Company Code",
                    supportMultiselect: true,
                    key: "Belnr",
                    ok: function (oEvent) {
                        var aTokens = oEvent.getParameter("tokens");

                        aTokens.forEach(token => {
                            var sKey = token.getKey(); 
                            token.setKey(sKey);
                            token.setText(sKey);
                        });

                        oInput.setTokens(aTokens);
                        console.log(oInput.getTokens());
                        this.close();
                    },
                    cancel: function () {
                        this.close();
                    }
                });

                oView.addDependent(this._oValueHelpDialog);

                // Create a table for the ValueHelpDialog
                var oTable = new Table({
                    columns: [
                        new Column({
                            label: new Label({ text: "Company Code" }),
                            template: new Text({ text: "{Bukrs}" })
                        }),
                        new Column({
                            label: new Label({ text: "Document Number" }),
                            template: new Text({ text: "{Belnr}" })
                        }),
                        new Column({
                            label: new Label({ text: "Fiscal Year" }),
                            template: new Text({ text: "{Gjahr}" })
                        }),
                        new Column({
                            label: new Label({ text: "Item" }),
                            template: new Text({ text: "{Buzid}" })
                        }),
                    ]
                });

                this._oValueHelpDialog.setTable(oTable);
            }
            //Set data for search help
            this._oValueHelpDialog.getTable().setModel(this._oSearchModel);
            this._oValueHelpDialog.getTable().bindRows("/");
            // Open the ValueHelpDialog
            this._oValueHelpDialog.open();
        },
        onBeforeRebindTable: function(oEvent) {
            var oBindingParams = oEvent.getParameter("bindingParams");
            var oDocNoFilter = this.byId("Doc.NoFilter");
            
            if (oDocNoFilter) {
                var aDocNoTokens = oDocNoFilter.getTokens();
                
                if (aDocNoTokens && aDocNoTokens.length > 0) {
                    aDocNoTokens.forEach(function(oToken) {
                        var sValue = oToken.getKey();
                        oBindingParams.filters.push(new Filter("Belnr", FilterOperator.EQ, sValue));
                    });
                }
            }
            
            console.log("Filters:", oBindingParams.filters);
        }
    });
});
