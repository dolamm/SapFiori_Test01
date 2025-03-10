sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"
], (Controller, Filter, FilterOperator, JSONModel) => {
    "use strict";

    return Controller.extend("project1.controller.Detail", {
        onInit() {
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("Detail").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched(oEvent) {
            const sObjectId = oEvent.getParameter("arguments").objectId;
            const aObjectId = sObjectId.split("-");
            const sBukrs = aObjectId[0];
            const sGjahr = aObjectId[1];
            const sBelnr = aObjectId[2];

            console.log("Bukrs: " + sBukrs + ", Gjahr: " + sGjahr + ", Belnr: " + sBelnr);

            // Lấy dữ liệu từ backend
            const oModel = this.getView().getModel();
            const sPath = "/BSEG_TABSet";

            //Filter the data
            var aFilter = [];
            aFilter.push(new Filter("Bukrs", FilterOperator.EQ, sBukrs));
            aFilter.push(new Filter("Gjahr", FilterOperator.EQ, sGjahr));
            aFilter.push(new Filter("Belnr", FilterOperator.EQ, sBelnr));
            
            console.log("Filter: ", aFilter);

            oModel.read(sPath, { 
                filters: [aFilter],
                success: (oData) => {
                    const oDetailModel = new sap.ui.model.json.JSONModel(oData.results);
                    this.getView().setModel(oDetailModel, "Bseg");
                    console.log("Detail data: ", oData.results);
                },
                error: (oError) => {
                    console.error("Error fetching detail data: ", oError);
                }
            });
        },
        onSearch: function (oEvent) {
			// add filter for search
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new Filter("Belnr", FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			}

			// update list binding
			var oList = this.byId("idList");
			var oBinding = oList.getBinding("items");
			oBinding.filter(aFilters, "Application");
		},
        onSelectionChange: function (oEvent) {
			var oSearchList = oEvent.getSource();
			var oLabel = this.byId("idFilterLabel");
			var oInfoToolbar = this.byId("idInfoToolbar");

			var aContexts = oSearchList.getSelectedContexts(true);

			// update UI
			var bSelected = (aContexts && aContexts.length > 0);
			var sText = (bSelected) ? aContexts.length + " selected" : null;
			oInfoToolbar.setVisible(bSelected);
			oLabel.setText(sText);
		},
        onPressItem: function(oEvent) {
            //Get selected item
            var oSelectedBelnr = oEvent.getSource().getBindingContext("Bseg").getProperty("Belnr")
            var oSelectedBuzid = oEvent.getSource().getBindingContext("Bseg").getProperty("Buzid")

            var aFilterItem = [];
            aFilterItem.push(new Filter("Belnr", FilterOperator.EQ, oSelectedBelnr));
            aFilterItem.push(new Filter("Buzid", FilterOperator.EQ, oSelectedBuzid));
            console.log("Filter: ", aFilterItem);

            //Get data from backend
            var oModel = this.getView().getModel();
            var sPath = "/BSEG_TABSet";
            oModel.read(sPath, {
                filters: [aFilterItem],
                success: (oData) => {
                    var oDetailModel = new JSONModel(oData.results);
                    this.getView().setModel(oDetailModel, "BsegItem");
                    console.log("Detail data: ", oData.results);
                },
                error: (oError) => {
                    console.error("Error fetching detail data: ", oError);
                }
            });
        },
        onNavInput: function(oEvent) {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Input");
        },
    });
});