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
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/m/Token",
    "sap/m/Button"
], (Controller, ValueHelpDialog, JSONModel, Label, Text, Table, Column, Item, Filter, FilterOperator, FilterBar, FilterGroupItem, Token, Button) => {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        _oSearchModel: null,
        _currentInputId: null,
        
        onInit() {
             //Set the model for the ValueHelpDialog
            this._oSearchModel = new JSONModel();
            
            var oSmartTable = this.byId("smartTable");
            if (oSmartTable) {
                oSmartTable.attachBeforeRebindTable(this.onBeforeRebindTable, this);
            }
        },
        
        onAfterRendering() {
            // Get data from OData service
            var oModel = this.getView().getModel();
            if (oModel) {
                var sPath = "/BSEG_TABSet";
                oModel.read(sPath, {
                    success: (oData) => {
                        this._oSearchModel.setData(oData.results);
                        console.log("Dữ liệu search đã sẵn sàng:", oData.results.length, "bản ghi");
                    },
                    error: (oError) => {
                        console.error("Lỗi khi đọc dữ liệu:", oError);
                    }
                });
            }
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
            
            this._currentInputId = sInputId;
            
            if (!this._oValueHelpDialog) {
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
                
                this._oCompanySearchField = new sap.m.SearchField({
                    width: "100%",
                    search: function (oEvent) {
                        var sQuery = oEvent.getParameter("query");
                        that._filterCompanyCodes(sQuery);
                    }
                });
                
                this._oFiscalYearFilter = new sap.m.MultiComboBox({
                    width: "100%",
                    items: this._getFiscalYearItems(),
                    selectionChange: function(oEvent) {
                        that._filterByFiscalYear();
                    }
                });
                
                this._oValueHelpDialog = new ValueHelpDialog({
                    title: "Chọn giá trị",
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
                    },
                    afterClose: function() {
                        var oTable = that._oValueHelpDialog.getTable();
                        var oBinding = oTable.getBinding("rows");
                        if (oBinding) {
                            oBinding.filter([]);
                        }
                    }
                });
                
                oView.addDependent(this._oValueHelpDialog);
                
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
                            label: "Document Number",
                            control: this._oSearchField
                        }),
                        new FilterGroupItem({
                            groupName: "advanced",
                            name: "fiscalYear",
                            label: "Fiscal Year",
                            control: this._oFiscalYearFilter
                        })
                    ],
                    search: function(oEvent) {
                        var sQuery = that._oSearchField.getValue();
                        that._filterValueHelpDialogTable(sQuery);
                    },
                    clear: function(oEvent) {
                        that._oSearchField.setValue("");
                        that._oOperatorComboBox.setSelectedKey("EQ");
                        that._oFiscalYearFilter.setSelectedKeys([]);
                        
                        if (that._oCompanySearchField) {
                            that._oCompanySearchField.setValue("");
                        }
                        
                        var oTable = that._oValueHelpDialog.getTable();
                        var oBinding = oTable.getBinding("rows");
                        if (oBinding) {
                            oBinding.filter([]);
                        }
                    }
                });
                
                this._oValueHelpDialog.setFilterBar(oFilterBar);
                
                var oTable = new Table({
                    columns: [
                        new Column({
                            label: new Label({ text: "Mã công ty" }),
                            template: new Text({ text: "{Bukrs}" })
                        }),
                        new Column({
                            label: new Label({ text: "Số chứng từ" }),
                            template: new Text({ text: "{Belnr}" })
                        }),
                        new Column({
                            label: new Label({ text: "Năm tài chính" }),
                            template: new Text({ text: "{Gjahr}" })
                        }),
                        new Column({
                            label: new Label({ text: "Khoản mục" }),
                            template: new Text({ text: "{Buzei}" })
                        }),
                        new Column({
                            label: new Label({ text: "Ngày" }),
                            template: new Text({ text: "{Augdt}" })
                        })
                    ],
                    selectionMode: "Multi",
                    visibleRowCount: 10
                });
                
                this._oValueHelpDialog.setTable(oTable);
                this._oValueHelpDialog.addButton(this._oUseValueButton);
            }
            
            if (sInputId.indexOf("CompanyCodeFilter") !== -1) {
                this._oValueHelpDialog.setTitle("Select CompanyCode");
                
                var aFilterGroupItems = this._oValueHelpDialog.getFilterBar().getFilterGroupItems();
                var bHasCompanySearch = false;
                
                aFilterGroupItems.forEach(function(oItem) {
                    if (oItem.getName() === "companySearch") {
                        bHasCompanySearch = true;
                        oItem.setVisibleInFilterBar(true);
                    }
                });
                
                if (!bHasCompanySearch) {
                    this._oValueHelpDialog.getFilterBar().addFilterGroupItem(
                        new FilterGroupItem({
                            groupName: "advanced",
                            name: "companySearch",
                            label: "Company Code",
                            visibleInFilterBar: true,
                            control: this._oCompanySearchField
                        })
                    );
                }
                
            } else if (sInputId.indexOf("Doc.NoFilter") !== -1) {
                this._oValueHelpDialog.setTitle("Select Document Number");
                
                var aFilterGroupItems = this._oValueHelpDialog.getFilterBar().getFilterGroupItems();
                
                aFilterGroupItems.forEach(function(oItem) {
                    if (oItem.getName() === "companySearch") {
                        oItem.setVisibleInFilterBar(false);
                    }
                });
            }
            
            this._oValueHelpDialog.getTable().setModel(this._oSearchModel);
            this._oValueHelpDialog.getTable().bindRows("/");
            
            this._oValueHelpDialog.open();
        },
        
        _filterValueHelpDialogTable: function (sQuery) {
            var oTable = this._oValueHelpDialog.getTable();
            var oBinding = oTable.getBinding("rows");
            var sInputId = this._currentInputId;
            var bIsCompanyCode = sInputId && sInputId.indexOf("CompanyCodeFilter") !== -1;
            var bIsDocNo = sInputId && sInputId.indexOf("Doc.NoFilter") !== -1;
            
            if (oBinding) {
                if (sQuery && sQuery.trim() !== "") {
                    var aFilters = [];
                    
                    if (bIsCompanyCode) {
                        aFilters.push(new Filter("Bukrs", FilterOperator.Contains, sQuery));
                    } else if (bIsDocNo) {
                        aFilters.push(new Filter("Belnr", FilterOperator.Contains, sQuery));
                    } else {
                        aFilters.push(new Filter({
                            filters: [
                                new Filter("Bukrs", FilterOperator.Contains, sQuery),
                                new Filter("Belnr", FilterOperator.Contains, sQuery),
                                new Filter("Gjahr", FilterOperator.Contains, sQuery)
                            ],
                            and: false
                        }));
                    }
                    
                    oBinding.filter(aFilters);
                } else {
                    oBinding.filter([]);
                    if (this._oUseValueButton) {
                        this._oUseValueButton.setVisible(false);
                    }
                }
            }
        },
        
        _filterCompanyCodes: function(sQuery) {
            var oTable = this._oValueHelpDialog.getTable();
            var oBinding = oTable.getBinding("rows");
            
            if (oBinding) {
                if (sQuery && sQuery.trim() !== "") {
                    var oFilter = new Filter("Bukrs", FilterOperator.Contains, sQuery);
                    oBinding.filter([oFilter]);
                } else {
                    oBinding.filter([]);
                }
            }
        },
        
        _filterByFiscalYear: function() {
            var aSelectedYears = this._oFiscalYearFilter.getSelectedKeys();
            var oTable = this._oValueHelpDialog.getTable();
            var oBinding = oTable.getBinding("rows");
            
            if (oBinding && aSelectedYears.length > 0) {
                var aFilters = [];
                
                aSelectedYears.forEach(function(sYear) {
                    aFilters.push(new Filter("Gjahr", FilterOperator.EQ, sYear));
                });
                
                var oFilter = new Filter({
                    filters: aFilters,
                    and: false
                });
                
                oBinding.filter([oFilter]);
            } else if (oBinding) {
                oBinding.filter([]);
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
        },
        
        _formatDate: function(oDate) {
            if (!oDate) {
                return "";
            }
            
            var day = oDate.getDate();
            var month = oDate.getMonth() + 1;
            var year = oDate.getFullYear();
            
            return year + "-" + 
                   (month < 10 ? "0" + month : month) + "-" + 
                   (day < 10 ? "0" + day : day);
        },
        
        _getFiscalYearItems: function() {
            var aItems = [];
            var oYearMap = {};
            ["2020", "2021", "2022", "2023", "2024"].forEach(function(sYear) {
                oYearMap[sYear] = true;
                aItems.push(new Item({ key: sYear, text: sYear }));
            });
            
            if (this._oSearchModel && this._oSearchModel.getData()) {
                var aData = this._oSearchModel.getData();
                
                aData.forEach(function(item) {
                    if (item.Gjahr && !oYearMap[item.Gjahr]) {
                        oYearMap[item.Gjahr] = true;
                        aItems.push(new Item({ key: item.Gjahr, text: item.Gjahr }));
                    }
                });
            }
            
            aItems.sort(function(a, b) {
                return b.getKey() - a.getKey();
            });
            
            return aItems;
        },
        onSetDataForDropDown : function(oEvent){
            var oTable = this.byId("smartTable");
            var oBindingParams = oTable.getBinding("rows");
            var oValue = oEvent.getSource().getSelectedKey();
            oBindingParams.filter(new Filter("Buzei", FilterOperator.EQ, oValue));
        },
    });
});