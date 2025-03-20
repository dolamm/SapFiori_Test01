sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "sap/ui/model/json/JSONModel",
    "sap/m/Label",
    "sap/m/Text",
    "sap/ui/table/Table",
    "sap/ui/table/Column",
    "sap/ui/core/Item",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterGroupItem"
], (Controller, ValueHelpDialog, JSONModel, Label, Text, Table, Column, Item, Filter, FilterOperator, FilterBar, FilterGroupItem) => {
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
            var sInputId = oInput.getId(); 
            var that = this;
        
            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = new ValueHelpDialog({
                    title: "Select Value",
                    supportMultiselect: true,
                    key: "Belnr",
                    descriptionKey: "Bukrs",
                    ok: function (oEvent) {
                        var aTokens = oEvent.getParameter("tokens");
                        var sOperator = that._oOperatorComboBox.getSelectedKey();
                        
                        aTokens.forEach(token => {
                            var sKey = token.getKey(); 
                            token.setKey(sKey);
                            token.setText(sKey);
                            token.data("operator", sOperator); 
                        });
        
                        oInput.setTokens(aTokens);
                        this.close();
                    },
                    cancel: function () {
                        this.close();
                    }
                });
        
                oView.addDependent(this._oValueHelpDialog);
        
                this._oOperatorComboBox = new sap.m.ComboBox({
                    width: "150px",
                    placeholder: "Select Operator",
                    items: [
                        new Item({ key: "EQ", text: "Equals (=)" }),
                        new Item({ key: "Contains", text: "Contains" }),
                        new Item({ key: "StartsWith", text: "Starts With" }),
                        new Item({ key: "EndsWith", text: "Ends With" }),
                        new Item({ key: "NE", text: "Not Equal (≠)" }),
                        new Item({ key: "GT", text: "Greater Than (>)" }),
                        new Item({ key: "LT", text: "Less Than (<)" })
                    ],
                    selectedKey: "EQ"
                });
        
                this._oSearchField = new sap.m.SearchField({
                    width: "100%",
                    placeholder: "Search...",
                    search: function (oEvent) {
                        var sQuery = oEvent.getParameter("query");
                        that._filterValueHelpDialogTable(sQuery);
                    }
                });
        
                var oFilterBar = new FilterBar({
                    advancedMode: true,
                    filterBarExpanded: true,
                    filterGroupItems: [
                        new FilterGroupItem({
                            groupName: "default",
                            name: "operator",
                            label: "Operator",
                            control: this._oOperatorComboBox
                        }),
                        new FilterGroupItem({
                            groupName: "default",
                            name: "search",
                            label: "Search",
                            control: this._oSearchField
                        })
                    ]
                });
        
                this._oValueHelpDialog.setFilterBar(oFilterBar);
        
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
                        })
                    ]
                });
        
                this._oValueHelpDialog.setTable(oTable);
            }
            
            if (sInputId.indexOf("CompanyCodeFilter") !== -1) {
                this._oValueHelpDialog.setTitle("Select Company Code");
            } else if (sInputId.indexOf("Doc.NoFilter") !== -1) {
                this._oValueHelpDialog.setTitle("Select Document Number");
            }
            
            //Set data for search help
            this._oValueHelpDialog.getTable().setModel(this._oSearchModel);
            this._oValueHelpDialog.getTable().bindRows("/");
        
            // Open the ValueHelpDialog
            this._oValueHelpDialog.open();
        },
        _filterValueHelpDialogTable: function (sQuery) {
            var oTable = this._oValueHelpDialog.getTable();
            var oBinding = oTable.getBinding("rows");
            var oDocNoFilter = this.byId("Doc.NoFilter");
            var oCompanyCodeFilter = this.byId("CompanyCodeFilter");
        
            if (oBinding && oDocNoFilter) {
                if (sQuery && sQuery.trim() !== "") {
                    var aFilters = [];
                    aFilters.push(new Filter({
                        filters: [
                            new Filter("Belnr", FilterOperator.StartsWith, sQuery)
                        ],
                        and: false
                    }));
                    oBinding.filter(aFilters);
                } 
            }
            
            if (oBinding && oCompanyCodeFilter) {
                if (sQuery && sQuery.trim() !== "") {
                    var aFilters = [];
                    aFilters.push(new Filter({
                        filters: [
                            new Filter("Bukrs", FilterOperator.StartsWith, sQuery)
                        ],
                        and: false
                    }));
                    oBinding.filter(aFilters);
                }
            }
        },
        
        onBeforeRebindTable: function(oEvent) {
            var oBindingParams = oEvent.getParameter("bindingParams");
            var oDocNoFilter = this.byId("Doc.NoFilter");
            var oCompanyCodeFilter = this.byId("CompanyCodeFilter");
            
            if (oDocNoFilter) {
                var aDocNoTokens = oDocNoFilter.getTokens();
                
                if (aDocNoTokens && aDocNoTokens.length > 0) {
                    aDocNoTokens.forEach(function(oToken) {
                        var sValue = oToken.getKey();
                        var sOperator = oToken.data("operator") || "EQ"; 
                        var oFilterOp = this._getFilterOperator(sOperator);
                        
                        oBindingParams.filters.push(new Filter("Belnr", oFilterOp, sValue));
                    }.bind(this));
                }
            }
            
            if (oCompanyCodeFilter) {
                var aCompanyTokens = oCompanyCodeFilter.getTokens();
                
                if (aCompanyTokens && aCompanyTokens.length > 0) {
                    aCompanyTokens.forEach(function(oToken) {
                        var sValue = oToken.getKey();
                        var sOperator = oToken.data("operator") || "EQ";
                        var oFilterOp = this._getFilterOperator(sOperator);
                        
                        oBindingParams.filters.push(new Filter("Bukrs", oFilterOp, sValue));
                    }.bind(this));
                }
            }
            
            console.log("Filters:", oBindingParams.filters);
        },
        
        _getFilterOperator: function(sOperator) {
            switch(sOperator) {
                case "EQ":
                    return FilterOperator.EQ;
                case "NE":
                    return FilterOperator.NE;
                case "GT":
                    return FilterOperator.GT;
                case "GE":
                    return FilterOperator.GE;
                case "LT":
                    return FilterOperator.LT;
                case "LE":
                    return FilterOperator.LE;
                case "Contains":
                    return FilterOperator.Contains;
                case "StartsWith":
                    return FilterOperator.StartsWith;
                case "EndsWith":
                    return FilterOperator.EndsWith;
                default:
                    return FilterOperator.EQ;
            }
        }
    });
});
