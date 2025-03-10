sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "sap/ui/model/json/JSONModel",
    "sap/m/ColumnListItem",
    "sap/m/Label",
    "sap/m/Text",
    "sap/ui/table/Table",
    "sap/ui/table/Column"
], (Controller, ValueHelpDialog, JSONModel, ColumnListItem, Label, Text, Table, Column) => {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        onInit() {
        },
        onPress(oEvent) {
            // Lấy dữ liệu của dòng được nhấn
            const oItem = oEvent.getParameter("listItem") || oEvent.getSource();
            const oContext = oItem.getBindingContext();
            const sBukrs = oContext.getProperty("Bukrs");
            const sGjahr = oContext.getProperty("Gjahr");
            const sBelnr = oContext.getProperty("Belnr");

            // Chuyển sang trang detail
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Detail", {objectId: sBukrs + "-" + sGjahr + "-" + sBelnr });
        },
        onValueHelpRequestFilter: function (oEvent) {
            var oView = this.getView();
            var oInput = oEvent.getSource();

            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = new ValueHelpDialog({
                    title: "Select Company Code",
                    supportMultiselect: false,
                    key: "Bukrs",
                    descriptionKey: "Belnr",
                    ok: function (oEvent) {
                        var aTokens = oEvent.getParameter("tokens");
                        oInput.setTokens(aTokens);
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
                        })
                    ]
                });

                this._oValueHelpDialog.setTable(oTable);
            }

            // Set the model for the ValueHelpDialog
            var oModel = this.getView().getModel();
            var sPath = "/BSEG_TABSet";
            oModel.read(sPath, {
                success: (oData) => {
                    var oSearchModel = new JSONModel(oData.results);
                    this._oValueHelpDialog.getTable().setModel(oSearchModel);
                    this._oValueHelpDialog.getTable().bindRows("/");
                },
                error: (oError) => {
                    console.error("Error fetching data: ", oError);
                }
            });
            // Open the ValueHelpDialog
            this._oValueHelpDialog.open();
        }
    });
});