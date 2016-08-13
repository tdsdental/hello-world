function Sales() {
    this.step = "";  //1:选择客户 2:选择产品 3:处理订购
    this.title = "接单";
    this.mid = setting.currentMenuId;

    this.order_id = null;
    this.catDetail = [];
    this.Customer = null;
    this.Shipper = null;
    this.ShipMethod = null;
    this.PortOrigin = null;
    this.PortDestination = null;
    this.tax = true;
    this.fee = { "mode": 0, "amout": 0,"note":"" };

    this.order_info = null;
    this.order_deail_info = null;

    var _self = this;

    if (typeof Sales._initialized == "undefined") {
        Sales.prototype.Reset = function () {
            _self.catDetail = [];
            _self.Customer = null;
            _self.Shipper = null;
            _self.tax = true;
            _self.fee = { "mode": 0, "amout": 0, "note": "" };
        }

        Sales.prototype.init = function () {
            if (_self.step == "") _self.step = "initProductList";
            eval("_self." + _self.step + "()");
        }
   
        //接单Step1
        Sales.prototype.initProductList = function () {
            $("div[rel='Page']").hide();
            $("h2").text(_self.title);
            var currentDiv = $('<div rel="Page" relName="Sales_ProductList_Box"></div>');
            if ($('div[relName="Sales_ProductList_Box"]').length != 0) {
                $('div[relName="Sales_ProductList_Box"]').remove();
            }
            $(currentDiv).appendTo("#HtmlBox");
            $("#HtmlBox").mask("加载数据");
            LoadData.GetFlatProduct();
            LoadData.GetCompany(1);
            $(document).queue("ModuleFun", function () { initProducts(); });
            $(document).dequeue("ModuleFun");

            function initProducts() {
                $("#HtmlBox").unmask();
                var html = [];
                html.push('<p class="mt"><span id="ProductSearch"></span></p><div class="mt20 blocktb" id="listBox"></div><div id="SearchResultsBox"></div>');
                html.push('</div><div style="position:fixed;top:45px;margin-left:880px;z-index:9;" id="Sales_CatListBox"><span id="btnSearchHistoryForClient" class="btn1 mr20">客户历史订购产品查询</span><span id="btn_Sales_CatList">已订购产品列表</span></div>');
                $(currentDiv).html(html.join(''));
                $("#ProductSearch", currentDiv).SearchBox({ width: 400, data: localData.FlatProduct, SearchFeilds: ["product_number", "product_name", "product_name_chinese"], onSearch: function (data) { initList(data); } });
                $("#btn_Sales_CatList", currentDiv).Button({ Submit: _self.catDetail.length == 0 ? false : true, onClick: function () { _self.step = "initCatList"; _self.initCatList(); } });
                $("#btnSearchHistoryForClient").click(function () {
                    _self.SearchOrderHistory();
                });
            }
            //查询结果展示
            function initList(ProductsData) {
                var html = [];
                html.push('<div class="blocktb mt">');
                html.push('<div class="slarm font11">说明：此处所有状态的库存均为客户可订购量（已经减去其他订单锁定量）。</div>');
                html.push('<table width="100%" class="tb datalist" id="ProductBox">');
                html.push('<tr class="bg"><th width="80px;" rowspan="3">型号</th><th width="250px" rowspan="3">品名</th><th width="100px" rowspan="3">包装规格</th><th width="80px" colspan="7">库存</th><th width="80px" rowspan="3"></th></tr>');
                html.push('<tr class="bg"><th width="80px" colspan="2">中国仓库</th><th width="80px" colspan="2">运输中</th><th width="60px" colspan="2">制造中</th><th>锁定</h></tr>');
                html.push('<tr class="bg"><th width="60px">数量</th><th width="80px">交货日期</th><th width="60px">数量</th><th width="80px">交货日期</th><th width="60px">数量</th><th width="80px">交货日期</th><th width="60px">数量</th></tr>');
                html.push('</table>');
                $("#SearchResultsBox", currentDiv).html(html.join(''));
                var stock = [];
                $.each(ProductsData, function (i, product) {
                    var _html = [];
                    var _info = _self.getCatItemData(product.product_id, product.combination_id, product.PF);
                    var _tr = $('<tr align="center" rel="dateitem" product_id="' + product.product_id + '" combination_id="' + product.combination_id + '" PF="' + product.PF + '"></tr>');
                    _html.push('<td>' + product.product_number + '</td>');
                    _html.push('<td align="left">' + product.product_name_chinese + '<p class="color969696">' + product.product_name + '</p></td>');
                    _html.push('<td>' + Utility.GetProductSpecification(product.attributes_values, product.PF) + '</td>');
                    _html.push('<td><i class="icon-spinner icon-spin"></i></td><td><i class="icon-spinner icon-spin"></i></td>');
                    _html.push('<td><i class="icon-spinner icon-spin"></i></td><td><i class="icon-spinner icon-spin"></i></td>');
                    _html.push('<td><i class="icon-spinner icon-spin"></i></td><td><i class="icon-spinner icon-spin"></i></td>');
                    _html.push('<td><i class="icon-spinner icon-spin"></i></td>');
                    _html.push('<td><div rel="EditCatBox"' + (_info != null ? '' : ' class="undis"') + '><span rel="CancelCatItem" class="btn2">取消订购</span></div><div rel="AddCatBox"' + (_info != null ? ' class="undis"' : '') + '><span rel="AddCatItem" class="btn1">订购</span></div></td>');
                    $(_tr).html(_html.join(''));
                    $("#ProductBox tr:last", currentDiv).after(_tr);
                    $(_tr).data("info", product);
                    var _stockparams = {
                        product_id: product.product_id,
                        combination_id: product.combination_id,
                        PF: product.PF
                    };
                    stock.push(_stockparams);
                    if (_info != null) $(_tr).addClass("yellow");
                });
                GetStockInfo(stock);
                initEvent();
            }
            //初始化页面事件
            function initEvent() {
                $("tr[rel='dateitem']", currentDiv).each(function () {
                    var _tr = this;
                    $("span[rel='AddCatItem']", _tr).click(function () {
                        var _info = GetCatItemInfo(_tr);
                        _self.editCatData(_info, false);
                        $("div[rel='EditCatBox']", _tr).show();
                        $("div[rel='AddCatBox']", _tr).hide();
                        $(_tr).addClass("yellow");
                    });
                    $("span[rel='CancelCatItem']", _tr).click(function () {
                        var _info = GetCatItemInfo(_tr);
                        _self.editCatData(_info, true);
                        $("div[rel='EditCatBox']", _tr).hide();
                        $("div[rel='AddCatBox']", _tr).show();
                        $(_tr).removeClass("yellow");
                    });
                });
            }
            //获取库存信息
            function GetStockInfo(combinations) {
                var query = new Object();
                query.combinations = JSON.stringify(combinations);
                $.ajax({
                    type: "POST",
                    contentType: "application/json",
                    url: setting.WebService + "Product.asmx/GetProductTiemMFGList",
                    datatype: 'json',
                    data: JSON.stringify(query),
                    success: function (result) {
                        var data = eval('(' + result.d + ')');
                        $.each(data, function (i, info) {
                            var _tr = info.PF != 999 ? $("#ProductBox tr[rel='dateitem'][PF='" + info.PF + "'][combination_id='" + info.combination_id + "']", currentDiv) : $("#ProductBox tr[rel='dateitem'][PF='" + info.PF + "'][product_id='" + info.product_id + "']", currentDiv);
                            var td = 2;
                            $.each(info.stock, function (i, stock) {
                                var qtyhtml = [];
                                var datehtml = [];
                                $.each(stock.data, function (j, _stock) {
                                    qtyhtml.push('<p>' + _stock.Qty + '</p>');
                                    datehtml.push('<p>' + _stock.Date + '</p>');
                                });
                                td += 1;
                                $("td:eq(" + td + ")", _tr).html(qtyhtml.join(''));
                                td += 1;
                                $("td:eq(" + td + ")", _tr).html(datehtml.join(''));
                            });
                            $("td:eq(9)", _tr).html(info.locked);
                        });
                    }
                });
            }
            //获取编辑当前行的产品信息、数量和交货期
            function GetCatItemInfo(objtr) {
                var attributes_values = null;
                var unit_price = 0;
                var _cartInfo = $(objtr).data("info");
                var _info = {
                    order_detail_id: 0,
                    product_id: _cartInfo.product_id,
                    combination_id: (_cartInfo.PF != 999 ? _cartInfo.combination_id : 0).toString(),
                    sku: _cartInfo.product_number.toString().replace("<font color='red'>", '').replace("</font>", ""),
                    description: _cartInfo.product_name_chinese.toString().replace("<font color='red'>", '').replace("</font>", ""),
                    customer_part_number:'',
                    attributes_values: _cartInfo.attributes_values,
                    qty: "0",
                    unit_price: "0",
                    sales_price: (_cartInfo.PF != 999 ? _cartInfo.price : []),
                    request_date: "",
                    PF: _cartInfo.PF
                };
                return _info;
            }
        }
        //接单Step2
        Sales.prototype.initCatList = function () {
            $("div[rel='Page']").hide();
            $("h2").text(_self.title);
            var currentDiv = $('<div rel="Page" relName="Sales_Cat_List_Box"></div>');
            if ($('div[relName="Sales_Cat_List_Box"]').length != 0) {
                $('div[relName="Sales_Cat_List_Box"]').remove();
            }
            $(currentDiv).appendTo("#HtmlBox");
            var html = [];
            html.push('<div style="background:#fff9c9; padding:5px; border:1px solid #c3c3c3;margin:0px auto;width:550px;"><div class="tright"><i class="icon-remove-sign pointer icon-large"></i></div>');
            html.push('<div style="padding:5px;">选择客户：<span id="drpCustomer"></span></div>');
            html.push('<div style="padding:5px;" class="tleft blocktb"><b class="mb">已订购列表</b>');
            html.push('<table class="tb mt" width="540">');
            html.push('<tr><th width="100px">型号</th><th width="350px">规格</th><th></th></tr>');
            html.push('</table>');
            html.push('<div class="mt cf"><span class="btn2 left" id="Sales_Back_To_Step2">返回</span><span class="right" id="Sales_Go_To_ProcessSales">处理订单</span></div>');
            html.push('</div></div>');

            $(currentDiv).html(html.join(''));
            getThisDetail();
            $(".icon-remove-sign", currentDiv).click(function () {
                $(currentDiv).hide();
                $("div[relName='Sales_ProductList_Box']").show();
            });
            $("#Sales_Back_To_Step2", currentDiv).click(function () {
                _self.step = "initProductList";
                _self.initProductList();
            });

            $("#Sales_Go_To_ProcessSales", currentDiv).Button({ onClick: function () { _self.step = "ProcessSales"; _self.ProcessSales(); }, onHover: function () { checkError(); } });

            $("#drpCustomer", currentDiv).DropdownBox({
                data: localData.CustomerData,
                width: 300,
                search: true,
                textFeilds: ["company_code", "company_name"],
                valueFeild: "company_id",
                value: (_self.Customer == null ? 0 : _self.Customer.company_id),
                onChange: function (data) {
                    if (data.id != 0) {
                        _self.Customer = data;
                    }
                    CheckSubmit();
                }
            });

            CheckSubmit();
            function CheckSubmit() {
                var _Check = true;
                if ($("#drpCustomer", currentDiv).getDropdownSelect() == null) {
                    _Check = false;
                } else {
                    $("#drpCustomer .DropdownHead", currentDiv).removeClass("err");
                }
                $("#Sales_Go_To_ProcessSales", currentDiv).changeStatus(_Check);
            }

            function checkError() {
                $(".err").removeClass("err");
                if ($("#drpCustomer", currentDiv).getDropdownSelect() == null) $("#drpCustomer .DropdownHead", currentDiv).addClass("err");
            }

            function getThisDetail() {
                $("tr[rel='catitem']", currentDiv).remove();
                var html = [];
                $.each(_self.catDetail, function (i, info) {
                    html.push('<tr rel="catitem" align="center">');
                    html.push('<td>' + info.sku + '</td><td align="left">' + info.description + '</td><td><i class="icon-trash pointer" title="移除" combination_id="' + info.combination_id + '" product_id="' + info.product_id + '" PF="' + info.PF + '"></i></td>');
                    html.push('</tr>');
                });
                $("tr:first", currentDiv).after(html.join(''));
                $("tr[rel='catitem'] .icon-trash", currentDiv).click(function () {
                    var _info = {
                        product_id: $(this).attr("product_id"),
                        combination_id: $(this).attr("combination_id"),
                        PF: $(this).attr("PF")
                    };
                    _self.editCatData(_info, true);
                    getThisDetail();
                    if (_self.catDetail.length == 0) {
                        $("#Sales_Back_To_Step2", currentDiv).click();
                        $('div[relName="Sales_ProductList_Box"] #btn_Sales_CatList').changeStatus(false);
                    }
                });
                $('[format="amount"]', currentDiv).formatCurrency();
            }
        }
        //接单Step3
        Sales.prototype.ProcessSales = function () {
            $("div[rel='Page']").hide();
            $("h2").text(_self.title);
            var currentDiv = $('<div rel="Page" relName="Sales_Step_3"></div>');
            if ($('div[relName="Sales_Step_3"]').length != 0) {
                $('div[relName="Sales_Step_3"]').remove();
            }

            $(currentDiv).appendTo("#HtmlBox");
            var _buyer_purchase_number = "";
            LoadData.GetShipper();
            LoadData.GetPorts();
            $(document).queue("ModuleFun", function () {
                $.ajax({
                    type: "POST",
                    contentType: "application/json",
                    url: setting.WebService + "SalesOrder.asmx/GetNewBuyerPurchaseNumber",
                    datatype: 'json',
                    success: function (result) {
                        _buyer_purchase_number = result.d;
                        $(document).dequeue("ModuleFun");
                    }
                });
            });
            $(document).queue("ModuleFun", function () { initStep3Html(); });
            $(document).dequeue("ModuleFun");
            function initStep3Html() {
                var html = [];
                html.push('<div><p><span class="w90 tright">' + lang.Customer_Name + '：</span>' + _self.Customer.company_name + '</p><p class="mt5"><span class="w90 tright">客户采购单号：</span><input type="text" class="txtinput" size="20" id="buyer_purchase_number" value="' + _buyer_purchase_number + '"></p><p class="mt5"><span class="w90 tright">订单日期：</span>' + jsToday + '</p></div>');
                html.push('<div class="blocktb mt">');
                html.push('<table class="tb" width="100%" id="OrderDetailTB">');
                var strcurrent = _self.Customer.currency_id == 1 ? "元" : "美元";
                html.push('<tr class="bg"><th width="250px">型号</th><th>客户型号</th><th width="250px">规格</th><th width="80px">订购数量</th><th width="120px">单价(' + strcurrent + ')<e class="ml" rel="checkbox"><input type="checkbox" ' + (_self.tax ? " checked" : "") + ' class="mr5" id="Chk_Sales_Tax">含税</e></th><th width="130px">金额(' + strcurrent + ')</th><th wdith="200px">交货日期</th></tr>');

                html.push('<tr align="center" rel="feeitem"><td colspan="3">运费</td><td class="tbnoborder"></td><td class="tbnoborder"></td><td align="left"><div style="margin-left:20px;"><p><input type="radio" name="Rad_Sales_Fee" checked class="mr5" value="0"> <input type="text" id="Sales_Fee" class="txtinput" size="4" format="number"></p><p class="mt5"><input type="radio" name="Rad_Sales_Fee" class="mr5" value="1"> 稍后计算</p><p class="mt5"><input type="radio" name="Rad_Sales_Fee" class="mr5" value="2"> 免运费</p></div></td><td></td></tr>');
                html.push('<tr align="center" class="fontBold"><td colspan="3">总计</td><td><span rel="totalQty">' + _totalQty + '</span></td><td></td><td><span format="amount" rel="total" total="' + _totalAmount + '">' + _totalAmount + '</span></td><td></td></tr>');
                html.push('</table>');
                html.push('<table class="tb" width="100%" id="TB">');
                html.push('<tr class="f1"><td align="right" width="100px">运输方式：</td><td><span id="drpShipMethod"></span></td></tr>');
                html.push('<tr class="f1"><td align="right">物流公司：</td><td><span id="drpShiper"></span></td></tr>');
                html.push('<tr class="f1"><td align="right">始发港口：</td><td><span id="drpPortOrigin"></span></td></tr>');
                html.push('<tr class="f1"><td align="right">目的港口：</td><td><span id="drpPortDestination"></span></td></tr>');
                html.push('</table>');
                html.push('<div class="mt5"></div>');
                var _tempContent = tempContent.replace("{payment}", _self.Customer.payment_term);
                html.push('<div class="mt"><p><a id="btnShowUndis" isShow="true">合同条款<i class="icon-caret-down ml5"></i></a></p><p id="showUndisBox"><textarea id="OrderContent">' + _tempContent + '</textarea></p></div>');
                html.push('<div class="mt tright"><span class="p2" id="ConfirmContractTermsBox"><input type="checkbox" id="ConfirmContractTerms"> 合同条款已经阅读并确认</span></div>');
                html.push('<div class="mt cf"><span class="btn2 left" id="Sales_Back_To_CatList">返回</span><span class="right" id="btn_Sales_Go_To_Step4_2">保存为订单</span></div>');
                html.push('</div>');

                $(currentDiv).html(html.join(''));

                var _totalAmount = 0;
                var _totalQty = 0;
                $.each(_self.catDetail, function (i, info) {
                    var _html = [];
                    if (info.PF != 999) {
                        $.each(info.sales_price, function (i, _price) {
                            if (_price.typeid == _self.Customer.sales_price_type_id) {
                                if (_self.Customer.currency_id == 1) {
                                    info.unit_price = _price.price;
                                } else {
                                    info.unit_price = _price.price_usd;
                                }
                            }
                        });
                    }
                    _html.push('<tr rel="dataitem" align="center" PF="' + info.PF + '" product_id="' + info.product_id + '" combination_id="' + info.combination_id + '">');
                    _html.push('<td>' + info.sku + '<div rel="stockInfo" class="tleft" style="width:250px"></div></td>');
                    _html.push('<td align="left"><input type="text" class="txtinput" size="15" rel="customer_part_number" value="' + info.customer_part_number + '"></td>');
                    _html.push('<td align="left">' + info.description + '</td>');
                    _html.push('<td><input type="text" class="txtinput tcenter" size="5" format="number" rel="Qty" old_qty="' + info.qty + '" value="' + (parseInt(info.qty) == 0 ? "" : parseInt(info.qty)) + '"></td>');
                    if (info.PF != 999) {
                        _html.push('<td><span rel="unit_price" format="amount" unit_price="' + info.unit_price + '">' + info.unit_price + '</span></td>');
                    } else {
                        _html.push('<td><input type="text" class="txtinput" size="4" value="' + (info.unit_price == "0" ? "" : info.unit_price) + '" id="unit_price"><a class="icon-bar-chart icon-large ml" title="查看历史价格" report="TDS_Company_Product_Price" product_id="' + info.product_id + '" guid_company="' + _self.Customer.guid_company + '"></a></td>');
                    }
                    _html.push('<td><span rel="amount" format="amount" amount="' + (info.qty * info.unit_price) + '">' + (info.qty * info.unit_price) + '</span></td>');
                    if (info.PF != 999) {
                        _html.push('<td><p id="lblTips" class="undis slarm tcenter"><span></span></p><input type="text" class="txtinput tcenter ' + (info.request_date != "" ? "" : "disabled") + '" size="10" rel="Request_Date" format="date" ' + (info.request_date != "" ? "" : "disabled") + ' value="' + info.request_date + '"></td>');
                    } else {
                        _html.push('<td><input type="text" class="txtinput tcenter" size="10" rel="Request_Date" format="date" value="' + info.request_date + '"></td>');
                    }
                    _html.push('</tr>');
                    _totalAmount += (info.qty * info.unit_price);
                    _totalQty += (info.qty * 1);
                    $("tr[rel='feeitem']", currentDiv).before(_html.join(''));
                    var _tr = $("#OrderDetailTB tr[product_id='" + info.product_id + "'][combination_id='" + info.combination_id + "'][PF='" + info.PF + "']", currentDiv);
                    $(_tr).data("info", info);
                    var _stockInfo = $("div[rel='stockInfo']", _tr);
                    $(_stockInfo).html('');
                    $(_stockInfo).html('<p class="slarm"><i class="icon-spinner icon-spin mr5"></i>加载实时库存信息,请稍候...</p>');
                    _self.stockInfo(info.product_id, info.combination_id, info.PF, $(_stockInfo));
                    $(_stockInfo).hide();
                    if (i == 0) {
                        $(_stockInfo).show();
                    }
                });
                SubTotal();
                var _editor = $("#OrderContent", currentDiv).cleditor()[0];
                $("#showUndisBox").hide();
                $("#btnShowUndis", currentDiv).click(function () {
                    if ($(this).attr("isShow") == "true") {
                        $("#showUndisBox").show();
                        $(this).attr("isShow", "false");
                    } else {
                        $("#showUndisBox").hide();
                        $(this).attr("isShow", "true");
                    }
                });

                function initTrEvent() {
                    $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                        var _tr = this;
                        $(_tr).click(function () {
                            $("div[rel='stockInfo']", currentDiv).hide();
                            $("#lblTips", currentDiv).hide();
                            $("div[rel='stockInfo']", this).show();
                            if ($(" #lblTips span", this).text() != "") {
                                $("#lblTips", this).show();
                            }
                        });
                        $("input[rel='Qty']", _tr).numeral({
                            onBlur: function (obj) {
                                var requestDate = $("input[rel='Request_Date']", _tr);
                                var dateTips = $("#lblTips", _tr);
                                var _info = $(_tr).data("info");
                                if (_info.PF != 999) {
                                    if ($(obj).val() != "") {
                                        if ($(obj).val() != $(obj).attr("old_qty")) {
                                            requestDate.attr("disabled", false);
                                            requestDate.removeClass("disabled");
                                            $(obj).attr("old_qty", $(obj).val());
                                            var startDate = _self.getRequestDate($(_tr).attr("combination_id"), $(obj).val(), _tr);
                                            requestDate.datetimepicker('setStartDate', startDate);
                                            $("span", dateTips).text("预计" + startDate + "交货");
                                            dateTips.show();
                                            requestDate.val('');
                                        }
                                    } else {
                                        requestDate.val('');
                                        requestDate.attr("disabled", true);
                                        requestDate.addClass("disabled");
                                        $("span", dateTips).text('');
                                        dateTips.hide();
                                    }
                                }
                                $("span[rel='amount']", _tr).text($(obj).val() * _info.unit_price);
                                $("span[rel='amount']", _tr).attr("amount", $(obj).val() * _info.unit_price);
                                checkSubmit();
                                SubTotal();
                                $('[format="amount"]').formatCurrency();
                                var _iteminfo = _self.getCatItemData(_info.product_id, _info.combination_id, _info.PF);
                                _iteminfo.qty = $(obj).val();
                                _self.editCatData(_iteminfo, false);
                            }
                        });
                        $("input[rel='Request_Date']", _tr).change(function () {
                            checkSubmit();
                            var _info = $(_tr).data("info");
                            var _iteminfo = _self.getCatItemData(_info.product_id, _info.combination_id, _info.PF);
                            _iteminfo.request_date = $(this).val();
                            _self.editCatData(_iteminfo, false);
                        });
                        $("#unit_price", _tr).numeral({
                            point: true,
                            onBlur: function (obj) {
                                var _info = $(_tr).data("info");
                                $("span[rel='amount']", _tr).text($(obj).val() * _info.qty);
                                $("span[rel='amount']", _tr).attr("amount", $(obj).val() * _info.qty);
                                var _iteminfo = _self.getCatItemData($(_tr).attr("product_id"), 0, 999);
                                _iteminfo.unit_price = $(obj).val();
                                _self.editCatData(_iteminfo, false);
                                SubTotal();
                                $('[format="amount"]').formatCurrency();
                                checkSubmit();
                            }
                        });
                        $("input[rel='customer_part_number']", _tr).change(function () {
                            checkSubmit();
                            var _info = $(_tr).data("info");
                            var _iteminfo = _self.getCatItemData(_info.product_id, _info.combination_id, _info.PF);
                            _iteminfo.customer_part_number = $(this).val();
                            _self.editCatData(_iteminfo, false);
                        });
                    });
                    $("[format='date']").datetimepicker({
                        weekStart: 1,
                        todayBtn: 0,
                        autoclose: 1,
                        todayHighlight: 1,
                        startView: 2,
                        minView: 2,
                        format: "mm/dd/yyyy",
                        startDate: jsToday
                    });
                }

                initTrEvent();

                $("#drpShipMethod", currentDiv).DropdownBox({
                    data: shipMethodData,
                    placeholder: "",
                    width: 80,
                    textFeilds: ["ship_method_name"],
                    valueFeild: "ship_method_id",
                    value: _self.ShipMethod == null ? 3 : _self.ShipMethod.ship_method_id,
                    onChange: function (data) {
                        _self.ShipMethod = data;
                        if (data.ship_method_id == 3) {
                            $("#drpPortOrigin", currentDiv).parents("tr").hide();
                            $("#drpPortDestination", currentDiv).parents("tr").hide();
                            $("#drpPortOrigin", currentDiv).DropdownBoxReset();
                            $("#drpPortDestination", currentDiv).DropdownBoxReset();
                            _self.PortDestination = null;
                            _self.PortOrigin = null;
                        } else {
                            $("#drpPortOrigin", currentDiv).parents("tr").show();
                            $("#drpPortDestination", currentDiv).parents("tr").show();
                        }
                        checkSubmit();
                    }
                });
                _self.ShipMethod = $("#drpShipMethod", currentDiv).getDropdownSelect();
                $("#drpShiper", currentDiv).DropdownBox({
                    data: localData.Shipper,
                    placeholder: "",
                    width: 150,
                    textFeilds: ["company_name"],
                    valueFeild: "company_id",
                    value: _self.Shipper == null ? null : _self.Shipper.company_id,
                    onChange: function (data) {
                        _self.Shipper = data;
                        checkSubmit();
                    }
                });

                $("#drpPortOrigin", currentDiv).DropdownBox({
                    data: localData.Ports,
                    placeholder: "",
                    width: 80,
                    textFeilds: ["port_name"],
                    valueFeild: "port_id",
                    value: _self.PortOrigin == null ? null : _self.PortOrigin.port_id,
                    onChange: function (data) {
                        _self.PortOrigin = data;
                        checkSubmit();
                    }
                });

                $("#drpPortDestination", currentDiv).DropdownBox({
                    data: localData.Ports,
                    placeholder: "",
                    width: 80,
                    textFeilds: ["port_name"],
                    valueFeild: "port_id",
                    value: _self.PortDestination == null ? null : _self.PortDestination.port_id,
                    onChange: function (data) {
                        _self.PortDestination = data;
                        checkSubmit();
                    }
                });

                if (_self.ShipMethod == null || _self.ShipMethod.ship_method_id == 3) {
                    $("#drpPortOrigin", currentDiv).parents("tr").hide();
                    $("#drpPortDestination", currentDiv).parents("tr").hide();
                } else {
                    $("#drpPortOrigin", currentDiv).parents("tr").show();
                    $("#drpPortDestination", currentDiv).parents("tr").show();
                }

                $('[format="amount"]').formatCurrency();

                $("#btn_Sales_Go_To_Step4_2", currentDiv).Button({ onClick: function () { Submit("SalesOrder"); }, onHover: function () { checkError(); } });
                $("#Chk_Sales_Tax", currentDiv).change(function () {
                    if ($(this).attr("checked") == "checked") {
                        $("tr[rel='dataitem'][PF='1'] span[rel='unit_price']", currentDiv).each(function () {
                            $(this).text($(this).attr($(this).attr("rel")));
                            var _tr = $(this).parents("tr");
                            $("span[rel='amount']", _tr).text($(this).text() * 1 * $("span[rel='Qty']", _tr).text() * 1);
                            $("span[rel='amount']", _tr).attr("amount", $(this).text() * 1 * $("span[rel='Qty']", _tr).text() * 1);
                        });
                        _self.tax = true;
                    } else {
                        $("tr[rel='dataitem'][PF='1'] span[rel='unit_price']", currentDiv).each(function () {
                            var _tr = $(this).parents("tr");
                            $(this).text(($(this).attr("unit_price") / 1.1).toFixed(2));
                            $("span[rel='amount']", _tr).text($(this).text() * 1 * $("span[rel='Qty']", _tr).text() * 1);
                            $("span[rel='amount']", _tr).attr("amount", $(this).text() * 1 * $("span[rel='Qty']", _tr).text() * 1);
                        });
                        _self.tax = false;
                    }
                    SubTotal();
                    $('[format="amount"]').formatCurrency();
                });
                $("#ConfirmContractTerms,#buyer_purchase_number", currentDiv).change(function () { checkSubmit(); });
                $("input[name='Rad_Sales_Fee'][value='" + _self.fee.mode + "']", currentDiv).attr("checked", true);
                if (_self.fee.mode == 0 && _self.fee.amout != 0) $("#Sales_Fee", currentDiv).val(_self.fee.amout);
                $("input[name='Rad_Sales_Fee']", currentDiv).change(function () {
                    _self.fee.mode = $(this).val();
                    _self.fee.amout = 0;
                    var _sales_fee = $("#Sales_Fee", currentDiv);
                    if ($(this).val() == 0) {
                        _sales_fee.attr("disabled", false);
                        _sales_fee.removeClass("disabled");
                    } else {
                        _sales_fee.val('');
                        _sales_fee.attr("disabled", true);
                        _sales_fee.addClass("disabled");
                        if ($(this).val() == 1) _self.fee.note = "稍后计算";
                        if ($(this).val() == 2) _self.fee.note = "免运费";
                    }
                    checkSubmit();
                    countFeeAndTotal();
                });


                $("#Sales_Fee", currentDiv).numeral({
                    point: true, onBlur: function (obj) {
                        if (obj.val() != "") {
                            _self.fee.amout = obj.val();
                        } else {
                            _self.fee.amout = 0;
                        }
                        countFeeAndTotal(); checkSubmit();
                    }
                });
                $("#Sales_Back_To_CatList").click(function () {
                    _self.step = "initProductList";
                    $(currentDiv).hide();
                    $("div[relName='Sales_ProductList_Box']").show();
                });


                function SubTotal() {
                    var _total_amount = 0;
                    var _total_qty = 0;
                    $("tr[rel='dataitem']", currentDiv).each(function () {
                        var thisPF = $(this).attr("PF");
                        var amount = $("span[rel='amount']", this).attr("amount");
                        _total_amount += (amount * 1);
                        _total_qty += ($("input[rel='Qty']", this).val() * 1);
                    });
                    $("span[rel='total']", currentDiv).attr("total", _total_amount);
                    $("span[rel='totalQty']", currentDiv).text(_total_qty);
                    countFeeAndTotal();
                }
                function countFeeAndTotal() {
                    $("span[rel='total']", currentDiv).text(parseFloat($("span[rel='total']", currentDiv).attr("total")) + parseFloat(_self.fee.amout));
                    $('[format="amount"]').formatCurrency();
                }

                function checkSubmit() {
                    var check = true;
                    if (_self.fee.mode == 0 && _self.fee.amout == 0) {
                        check = false;
                    } else {
                        $("#Sales_Fee", currentDiv).removeClass("err");
                    }
                    if (_self.Shipper == null) {
                        check = false;
                    } else {
                        $("#drpShiper .DropdownHead", currentDiv).removeClass("err");
                    }
                    if ($("#ConfirmContractTerms:checked", currentDiv).length == 0) {
                        check = false;
                    } else {
                        $("#ConfirmContractTermsBox", currentDiv).removeClass("err");
                    }
                    if ($("#buyer_purchase_number", currentDiv).val() == "") {
                        check = false;
                    } else {
                        $("#buyer_purchase_number", currentDiv).removeClass("err");
                    }
                    $("tr[rel='dataitem'][PF='999']", currentDiv).each(function () {
                        var _tr = this;
                        if ($("#unit_price", _tr).val() == "") {
                            check = false;
                        } else {
                            $("#unit_price", _tr).removeClass("err");
                        }
                    });
                    if ($("#drpShipMethod", currentDiv).getDropdownSelect() == null) {
                        check = false;
                    } else {
                        $("#drpShipMethod .DropdownHead", currentDiv).removeClass("err");
                        if ($("#drpShipMethod", currentDiv).getDropdownSelect().ship_method_id != 3) {
                            if ($("#drpPortDestination", currentDiv).getDropdownSelect() == null) {
                                check = false;
                            } else {
                                $("#drpPortDestination .DropdownHead", currentDiv).removeClass("err");
                            }
                        }
                    }

                    $("#btn_Sales_Go_To_Step4_1", currentDiv).changeStatus(check);
                    $("#btn_Sales_Go_To_Step4_2", currentDiv).changeStatus(check);
                }

                function checkError() {
                    $(".err").removeClass("err");
                    if (_self.fee.mode == 0 && _self.fee.amout == 0) $("#Sales_Fee", currentDiv).addClass("err");
                    if (_self.Shipper == null) $("#drpShiper .DropdownHead", currentDiv).addClass("err");
                    if ($("#ConfirmContractTerms:checked", currentDiv).length == 0) $("#ConfirmContractTermsBox", currentDiv).addClass("err");
                    if ($("#buyer_purchase_number", currentDiv).val() == "") $("#buyer_purchase_number", currentDiv).addClass("err");
                    $("tr[rel='dataitem'][PF='999']", currentDiv).each(function () {
                        var _tr = this;
                        if ($("#unit_price", _tr).val() == "") {
                            $("#unit_price", _tr).addClass("err");
                        }
                    });
                    if ($("#drpShipMethod", currentDiv).getDropdownSelect() == null) {
                        $("#drpShipMethod .DropdownHead", currentDiv).addClass("err");
                    } else {
                        if ($("#drpShipMethod", currentDiv).getDropdownSelect().ship_method_id != 3) {
                            if ($("#drpPortDestination", currentDiv).getDropdownSelect() == null) {
                                $("#drpPortDestination .DropdownHead", currentDiv).addClass("err");
                            }  
                        }
                    }
                }
                function Submit(mode) {
                    $("#HtmlBox").mask("正在提交数据...");
                    var _subTotal = $("span[rel='total']", currentDiv).attr("total");
                    var charge_detail = { "Fees": [{ "name": "SHIPPING & HANDING", "qty": 0, "price": _self.fee.amout.toString(), "mode": _self.fee.mode, "note": _self.fee.note }], "TOTAL": (parseFloat(_subTotal) + parseFloat(_self.fee.amout)).toString(), "SUBTOTAL": _subTotal.toString() };
                    var _requestDate = [];
                    $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                        _requestDate.push($("input[rel='Request_Date']", this).val());
                    });
                    _requestDate.sort(function (a, b) {
                        if (a == b) {
                            return 0;
                        }
                        var dt1 = new Date(a.replace(/-/g, "/"));
                        var dt2 = new Date(b.replace(/-/g, "/"));
                        if (dt1.getTime() > dt2.getTime()) {
                            return -1;
                        }
                        else {
                            return 1;
                        }
                    });

                    var order_info = {
                        "order_id": 0,
                        "type_name": "SO",
                        "quotation_id": 0,
                        "quotation_number": "",
                        "buyer_company_id": _self.Customer.company_id,
                        "buyer_company_code": _self.Customer.company_code,
                        "buyer_company": _self.Customer,
                        "buyer_purchase_number": $("#buyer_purchase_number", currentDiv).val(),
                        "payment_term_id": _self.Customer.payment_term_id,
                        "payment_term": _self.Customer.payment_term,
                        "ship_via_id": _self.Shipper.company_id,
                        "ship_via": _self.Shipper.company_name,
                        "ship_method": _self.ShipMethod,
                        "port_origin": _self.PortOrigin == null ? { port_id: 0, port_name: "" } : _self.PortOrigin,
                        "port_destination": _self.PortDestination == null ? { port_id: 0, port_name: "" } : _self.PortDestination,
                        "tax_ind": $("#Chk_Sales_Tax:checked", currentDiv).length == 0 ? false : true,
                        "currency": _self.Customer.currency_id == 1 ? "RMB" : "USD",
                        "currency_rate": "1",
                        "term_note": $("#OrderContent", currentDiv).val(),
                        "charge_detail": charge_detail,
                        "total": (parseFloat(_subTotal) + parseFloat(_self.fee.amout)).toString(),
                        "request_date": _requestDate[0],
                        "CurrentNote": "",
                        "bank": BankData[0],
                        "PF": 0,
                        "PFID": ""
                    };
                    $.each(_self.catDetail, function (i, detail) {
                        detail.unit_price = detail.unit_price.toString();
                    });
                    var query = new Object();
                    query.OrderInfo = JSON.stringify(order_info);
                    query.OrderDetail = JSON.stringify(_self.catDetail);
                    $.ajax({
                        type: "POST",
                        contentType: "application/json",
                        url:  setting.WebService + "SalesOrder.asmx/InsertOrder",
                        datatype: 'json',
                        data: JSON.stringify(query),
                        success: function (result) {
                            var response = eval('(' + result.d + ')');
                            $("#HtmlBox").unmask();
                            if (response.flag) {
                                _self.step = "";
                                _self.Reset();
                                location.hash = "!ProcessSales?" + (mode == "Quotation" ? "qid" : "soid") + "=" + response.data.order_id + "&mode=" + mode + "&num=" + response.data.order_number;
                            } else {
                                jAlert(response.message);
                            }
                        }
                    });
                }
            }
        }
        //修改订购列表产品数据
        Sales.prototype.editCatData = function (data,delete_ind) {
            var has = false;
            $.each(_self.catDetail, function (i, info) {
                if (info.product_id == data.product_id && info.combination_id == data.combination_id && info.PF == data.PF) {
                    has = true;
                    if (delete_ind) {
                        _self.catDetail.splice(i, 1);
                        return false;
                    } else {
                        info.qty = data.qty;
                        info.unit_price = data.unit_price;
                        info.customer_part_number = data.customer_part_number;
                        info.request_date = data.request_date;
                    }
                }
            });
            if (!has) _self.catDetail.push(data);
            var _Check = true;
            if (_self.catDetail.length == 0) {
                _Check = false;
            }
            $("div[relName='Sales_ProductList_Box'] #btn_Sales_CatList").changeStatus(_Check);
        }
        //获取订购列表单个产品信息
        Sales.prototype.getCatItemData = function (product_id, combination_id, PF) {
            var _info = null;
            $.each(_self.catDetail, function (i, info) {
                if (info.product_id == product_id && info.combination_id == combination_id && info.PF == PF) {
                    _info = info;
                }
            });
            return _info;
        }
        //获取库存状态列表
        Sales.prototype.stockInfo = function (product_id,combination_id, PF, box, lock_self_data) {
            var html = [];
            var query = new Object();
            query.product_id = product_id;
            query.combination_id = combination_id;
            query.PF = PF;
            $.ajax({
                type: "POST",
                contentType: "application/json",
                url: setting.WebService + "Product.asmx/GetProductTiemMFG",
                datatype: 'json',
                data: JSON.stringify(query),
                success: function (result) {
                    info = eval('(' + result.d + ')');
                    html.push('<table class="tb font11" style="width:250px;" id="stockInfo" period_date="' + info.period.Date + '">');
                    html.push('<tr><th width="60px">数量</th><th width="70px">可交货日期</th><th width="120px">状态</th></tr>');
                    if (lock_self_data != undefined) {
                        html.push('<tr align="center" rel="statusitem"><td>' + lock_self_data.Qty + '</td><td>' + lock_self_data.Date + '</td><td>Lock Self</td></tr>');
                    }
                    $.each(info.stock, function (i, stock) {
                        $.each(stock.data, function (j, _stock) {
                            html.push('<tr align="center" rel="statusitem"><td>' + _stock.Qty + '</td><td>' + _stock.Date + '</td><td>' + stock.Status + '</td></tr>');
                        });
                    });
                    html.push('</table>');
                    html.push('<div style="width:250px;"><div class="mt5">该产品的采购周期： ' + info.period.Days + ' 天 <p>(即日下单预计可于 ' + info.period.Date + ' 交货)</p></div>');

                    html.push('<div class="color969696 font11">说明：<p>1.此处所有状态的库存均为客户可订购量（已经减去其他订单锁定量）。</p><p>2.当需求量大于所有状态的库存量时，日期为采购的时间。</p><p>3.产品的采购周期在产品管理中设置。</p></div></div>');
                    $(box).html(html.join(''));
                    $("#stockInfo", box).rowSpan(2);
                    $(box).attr("loaded", true);
                }
            });
        }
        //获取交货期
        Sales.prototype.getRequestDate = function (combination_id,need_qty,_obj) {
            var currentQty = 0;
            var currentDate = $("#stockInfo", _obj).attr("period_date");
            var haspass = false;
            $("#stockInfo tr[rel='statusitem']", _obj).each(function () {
                currentQty += parseFloat($("td:eq(0)", this).text());
                if (currentQty >= need_qty && !haspass) {
                    currentDate = $("td:eq(1)", this).text();
                    haspass = true;
                }
            });
            return currentDate;
        }
        //客户历史订购产品查询
        Sales.prototype.SearchOrderHistory = function () {
            var html = [];
            html.push('<div style="padding:5px;" id="SearchHistoryForClientBox"><p>选择客户：<span id="drpCustomer"></span></p><div class="mt20 blocktb" id="SearchOrderHistoryListBox" style="height:300px;overflow-y:auto; overflow:hidden;"></div></div>');
            $(document.body).Dialog({ title: "客户历史订购产品查询", content: html.join(''), width: 682 });
            $("#SearchHistoryForClientBox #drpCustomer").DropdownBox({
                data: localData.CustomerData,
                width: 300,
                search: true,
                textFeilds: ["company_code", "company_name"],
                valueFeild: "company_id",
                onChange: function (data) {
                    var company_id = 0;
                    var company_guid = "";
                    if (data.id != 0) {
                        company_id = data.company_id;
                        company_guid = data.guid_company;
                    }
                    $("#plusDialog #SearchOrderHistoryListBox").mask("加载数据");
                    var query = new Object();
                    query.company_id = company_id;
                    query.company_guid = company_guid;
                    $.ajax({
                        type: "POST",
                        contentType: "application/json",
                        url: setting.WebService + "SalesOrder.asmx/GetSalesOrderProduct",
                        datatype: 'json',
                        data: JSON.stringify(query),
                        success: function (result) {
                            $("#plusDialog #SearchOrderHistoryListBox").unmask();
                            initList(eval('(' + result.d + ')'));
                        }
                    });
                }
            });

            function initList(data) {
                var html = [];
                html.push('<div class="fixedbox" id="fixedbox"><table width="600px" class="tb fixed"><tr class="bg"><th width="100px">型号</th><th width="350px">品名</th><th width="150px">包装规格</th></tr></table></div><div id="fiexedboxlist"><table width="600px" id="SearchOrderHistoryTB" class="tb datalist fixed">');
                $.each(data, function (i, product) {
                    
                    html.push('<tr rel="dataitem" align="center"><td width="100px">' + product.sku + '</td><td width="350px" align="left">' + product.product_full_name + '</td><td width="150px">' + (product.PF == 1 ? product.attributes_values.Package.cnmetervalue + '米/' + product.attributes_values.Package.namecn + '<span class="color969696 ml">(' + product.attributes_values.Package.value + product.attributes_values.Package.unitcn + '/' + product.attributes_values.Package.namecn + ')</span>' : '') + '</td>');
                    html.push('</tr>');
                });
                html.push('</table></div>');
                $("#plusDialog #SearchOrderHistoryListBox").html(html.join(''));
                InitFixBoxListPaddingTop($("#plusDialog"));
                
            }
        }
        //修改订单，复制报价单
        Sales.prototype.SalesOrder = function () {
            $("div[rel='Page']").hide();7
            $("h2").text('修改销售订单');

            var currentDiv = $('<div rel="Page" relName="SalesOrder_Edit_Box"></div>');
            if ($("div[relName='SalesOrder_Edit_Box']").length != 0) {
                $("div[relName='SalesOrder_Edit_Box']").remove();
            }
            $(currentDiv).appendTo("#HtmlBox");

            _self.initOrderHtml(currentDiv);
        }
        Sales.prototype.initOrderHtml = function (currentDiv) {
            _self.order_id = getUrlParam("soid") == null ? 0 : getUrlParam("soid");
            $("#HtmlBox").mask("加载数据");
            LoadData.GetOrderInfo(_self.order_id);
            LoadData.GetFlatProduct();
            LoadData.GetShipper();
            LoadData.GetPorts();
            LoadData.GetCompany(1);
            LoadData.GetCountry();
            $(document).queue("ModuleFun", function () { initOrder(); });
            $(document).dequeue("ModuleFun");

            function initOrder() {
                $("#HtmlBox").unmask();
                var _orderInfo = localData.OrderInfoData.orderInfo;
                var _details = localData.OrderInfoData.details;
                _self.tax = _orderInfo.tax_ind;
                var html = [];
                html.push('</div><div style="position:fixed;top:45px;margin-left:990px;z-index:9;" id="Sales_CatListBox"><span id="btnSearchHistoryForClient" class="btn1">客户历史订购产品查询</span></div>');
                html.push('<p class="mt5"><span class="w90 tright">客户名称：</span>' + _orderInfo.buyer_info.company_name + '</p>');
                html.push('<p class="mt5"><span class="w90 tright">销售单号：</span>' + _orderInfo.order_number + '</p>');
                html.push('<p class="mt5"><span class="w90 tright">客户采购单号：</span><input type="text" class="txtinput" value="' + _orderInfo.buyer_purchase_number + '" id="buyer_purchase_number"></p>');
                html.push('<p class="mt"><span class="w90 tright">订单币种：</span><input type="radio" name="radCurrency" value="RMB"> RMB</p>');
                html.push('<p class="mt5"><span class="w90 tright">&nbsp;</span><input type="radio" name="radCurrency" value="USD"> USD</p>');
                html.push('<p class="mt5"><span class="w90 tright">订单日期：</span>' + _orderInfo.order_date + '</p>');
                html.push('<p class="mt5 cf"><span class="w90 left tright">收货地址：</span><span id="address-box" class="left"></span></p>');

                html.push('<div class="blocktb mt">');
                html.push('<table class="tb" width="100%" id="OrderDetailTB">');
                html.push('<tr class="bg"><th width="250px">型号</th><th>客户型号</th><th>规格</th><th width="80px">订购数量</th><th width="120px">单价(' + _orderInfo.currency + ')<e class="ml" rel="checkbox"><input type="checkbox" ' + (_self.tax ? " checked" : "") + ' class="mr5" id="Chk_Sales_Tax">含税</e></th><th width="130px">金额(' + _orderInfo.currency + ')</th><th wdith="150px">交货日期</th><th width="20px"></th></tr>');
                html.push('<tr align="center" rel="newitem"><td colspan="3"><span id="drpProduct"></span></td><td></td><td></td><td></td><td></td><td></td></tr>');
                html.push('<tr align="center"><td colspan="3">运费</td><td class="tbnoborder"></td><td class="tbnoborder"></td><td align="left"><div style="margin-left:20px;"><p><input type="radio" name="Rad_Sales_Fee" checked class="mr5" value="0"> <input type="text" id="Sales_Fee" class="txtinput" size="4" format="number"></p><p class="mt5"><input type="radio" name="Rad_Sales_Fee" class="mr5" value="1"> 稍后计算</p><p class="mt5"><input type="radio" name="Rad_Sales_Fee" class="mr5" value="2"> 免运费</p></div></td><td></td><td></td></tr>');
                
                html.push('</table>');
                html.push('<table class="tb" width="100%" id="TB">');
                html.push('<tr class="f1"><td align="right" width="100px">运输方式：</td><td><span id="drpShipMethod"></span></td></tr>');
                html.push('<tr class="f1"><td align="right">物流公司：</td><td><span id="drpShiper"></span></td></tr>');
                html.push('<tr class="f1"><td align="right">始发港口：</td><td><span id="drpPortOrigin"></span></td></tr>');
                html.push('<tr class="f1"><td align="right">目的港口：</td><td><span id="drpPortDestination"></span></td></tr>');
                html.push('</table>');
                var _tempContent = _orderInfo == null ? tempContent : _orderInfo.term_note;
                _tempContent = _tempContent.replace("{payment}", _orderInfo == null ? _self.Customer.payment_term : _orderInfo.payment_term);
                html.push('<div class="mt"><p><a id="btnShowUndis" isShow="true">合同条款<i class="icon-caret-down ml5"></i></a></p><p id="showUndisBox"><textarea id="OrderContent">' + _tempContent + '</textarea></p></div>');
                html.push('<div class="mt tright"><span class="p2" id="ConfirmContractTermsBox"><input type="checkbox" id="ConfirmContractTerms"> 合同条款已经阅读并确认</span></div>');
                html.push('<div class="mt cf"><div class="left"><span id="btnSalesOrderDelete" class="btn2 undis">删除</span></div><div class="right"><span id="btnSalesOrderSubmit">保存</span></div></div>');
                html.push('</div>');

                $(currentDiv).html(html.join(''));

                $("input[name='radCurrency'][value='" + _orderInfo.currency + "']", currentDiv).attr("checked", "checked");

                $("#btnSearchHistoryForClient").click(function () {
                    _self.SearchOrderHistory();
                });
                var addressData = [];
                addressData.push(_orderInfo.ship_info);
                $("#address-box", currentDiv).Address({
                    Country:localData.Country,
                    country_id: 45,
                    data: addressData,
                });

                var _totalAmount = 0;
                var _totalQty = 0;
                $.each(_details, function (i, info) {
                    var _html = [];
                    info.unit_price = _self.tax ? info.unit_price : (info.unit_price * 1.1).toFixed(2);
                    var _amount =  info.qty * info.unit_price;
                    _html.push('<tr rel="dataitem" align="center" product_id="' + info.product_id + '" combination_id="' + info.combination_id + '" PF="' + info.PF + '">');
                    _html.push('<td>' + info.sku + '<div rel="stockInfo" class="tleft" style="width:250px"></div></td>');
                    _html.push('<td align="left"><input type="text" class="txtinput" size="15" rel="customer_part_number" value="' + info.customer_part_number + '"></td>');
                    _html.push('<td align="left">' + info.description + '</td>');
                    _html.push('<td><input type="text" class="txtinput tcenter" size="5" format="number" rel="Qty" old_qty="' + info.qty + '" value="' + parseInt(info.qty) + '"></td>');
                    _html.push('<td>' + (info.PF != 999 ? '<input type="text" class="txtinput" unit_price="' + info.unit_price + '" size="6" value="' + (_self.tax ? info.unit_price : (info.unit_price / 1.1).toFixed(2)) + '" id="unit_price">' : '<input type="text" class="txtinput" size="6" value="' + info.unit_price + '" id="unit_price"><a class="icon-bar-chart icon-large ml" title="查看历史价格" report="TDS_Company_Product_Price" product_id="' + info.product_id + '" company_code="' + (_orderInfo == null ? _self.Customer.company_code : _orderInfo.buyer_info.company_code) + '" guid_company="' + (_orderInfo == null ? _self.Customer.guid_company : _orderInfo.buyer_info.guid_company) + '"></a>') + '</td>');
                    //<span rel="unit_price" format="amount" unit_price="' + info.unit_price + '">' + (_self.tax ? info.unit_price : (info.unit_price / 1.1).toFixed(2)) + '</span>
                    _html.push('<td><span rel="amount" format="amount" amount="' + _amount + '">' + _amount + '</span></td>');
                    _html.push('<td><p id="lblTips" style="width:90px" class="undis slarm tcenter"><span></span></p><input type="text" class="txtinput tcenter ' + (info.request_date != "" ? "" : "disabled") + '" size="10" rel="Request_Date" format="date" ' + (info.request_date != "" ? "" : "disabled") + ' value="' + info.request_date + '"></td><td><a class="icon-trash" title="Remove this item" id="btnRemoveItem"></a></td>');
                    _html.push('</tr>');
                    $("tr[rel='newitem']", currentDiv).before(_html.join(''));
                    var _tr = $("#OrderDetailTB tr[product_id='" + info.product_id + "'][combination_id='" + info.combination_id + "'][PF='" + info.PF + "']", currentDiv);
                    var locked = {
                        Qty: parseInt(info.qty),
                        Date: info.request_date
                    };
                    info.locked = locked;
                    $(_tr).data("info", info);
                    var _stockInfo = $("div[rel='stockInfo']", _tr);
                    $(_stockInfo).html('');
                    $(_stockInfo).hide();
                    $(_stockInfo).html('<p class="slarm"><i class="icon-spinner icon-spin mr5"></i>加载实时库存信息,请稍候...</p>');
                    _self.stockInfo(info.product_id,info.combination_id,info.PF, $(_stockInfo), info.locked);
                    if (i == 0) {
                        $(_stockInfo).show();
                    }
                    _totalQty += (info.qty * 1);
                });

                _totalAmount = _orderInfo.charge_detail.TOTAL;

                var _freight = _orderInfo.charge_detail.Fees[0];


                $("#OrderDetailTB tr:last", currentDiv).after('<tr align="center" class="fontBold"><td colspan="3">总计</td><td><span rel="totalQty">' + _totalQty + '</span></td><td></td><td><span format="amount" rel="total" total="' + _totalAmount + '">' + _totalAmount + '</span></td><td></td><td></td></tr>');

                var _editor = $("#OrderContent", currentDiv).cleditor()[0];
                $("#showUndisBox").hide();
                $("#btnShowUndis", currentDiv).click(function () {
                    if ($(this).attr("isShow") == "true") {
                        $("#showUndisBox").show();
                        $(this).attr("isShow", "false");
                    } else {
                        $("#showUndisBox").hide();
                        $(this).attr("isShow", "true");
                    }
                });
                $('[format="amount"]').formatCurrency();
                $("#btnSalesOrderSubmit", currentDiv).Button({ onClick: function () { Submit(); }, onHover: function () { checkError(); } });
                $("#drpProduct", currentDiv).each(function () {
                    var _this = this;
                    $(_this).DropdownBox({
                        data: localData.FlatProduct,
                        width: 400,
                        search: true,
                        textFeilds: ["product_number", "product_name_chinese"],
                        textLinkChar: " ",
                        valueFeild: "combination_id",
                        onChange: function (data) {
                            var unit_price = 0;
                            if (data.PF != 999) {
                                $.each(data.price, function (i, _price) {
                                    if (_price.typeid == _orderInfo.buyer_info.sales_price_type_id) {
                                        if (_orderInfo.currency == "RMB") {
                                            unit_price = _price.price;
                                        } else {
                                            unit_price = _price.price_usd;
                                        }
                                    }
                                });
                            }
                            var _info = {
                                order_detail_id: 0,
                                product_id: data.product_id,
                                combination_id: data.combination_id,
                                sku: data.product_number,
                                description: data.product_name_chinese,
                                customer_part_number: '',
                                attributes_values: data.attributes_values,
                                qty: '',
                                unit_price: unit_price,
                                request_date: '',
                                delete_ind: false,
                                PF: data.PF
                            };
                            var _has = false;
                            $.each(_details, function (i, detail) {
                                if (detail.PF != 999) {
                                    if (detail.combination_id == _info.combination_id) {
                                        _info = detail;
                                        _has = true;
                                    }
                                } else {
                                    if (detail.product_id == _info.product_id) {
                                        _info = detail;
                                        _has = true;
                                    }
                                }
                            });
                            if (!_has) _details.push(_info);
                            if (!_has || _info.delete_ind) {
                                _info.delete_ind = false;
                                $("div[rel='stockInfo']", currentDiv).hide();
                                $("#lblTips", currentDiv).hide();
                                var _html = [];
                                _html.push('<tr rel="dataitem" align="center" product_id="' + _info.product_id + '" combination_id="' + _info.combination_id + '" PF="' + _info.PF + '">');
                                _html.push('<td>' + _info.sku + '<div rel="stockInfo" class="tleft mt5" style="width:250px"></div></td>');
                                _html.push('<td align="left"><input type="text" class="txtinput" rel="customer_part_number" size="15" value="' + _info.customer_part_number + '"></td>');
                                _html.push('<td align="left">' + _info.description + '</td>');
                                _html.push('<td><input type="text" class="txtinput tcenter" size="5" format="number" rel="Qty" old_qty="0" value="' + _info.qty + '"></td>');
                                //<span rel="unit_price" format="amount" unit_price="' + _info.unit_price + '"></span>
                                _html.push('<td>' + (data.PF != 999 ? '<input type="text" class="txtinput" size="6" unit_price="' + _info.unit_price + '" value="' + _info.unit_price + '" id="unit_price">' : '<input type="text" class="txtinput" size="6" value="' + _info.unit_price + '" id="unit_price"><a class="icon-bar-chart icon-large ml" title="查看历史价格" report="TDS_Company_Product_Price" product_id="' + _info.product_id + '" company_code="' + (_orderInfo == null ? _self.Customer.company_code : _orderInfo.buyer_info.company_code) + '" guid_company="' + (_orderInfo == null ? _self.Customer.guid_company : _orderInfo.buyer_info.guid_company) + '"></a>') + '</td>');
                                _html.push('<td><span rel="amount" format="amount" amount="0">' + (_info.qty * _info.unit_price) + '</span></td>');
                                _html.push('<td><p id="lblTips" class="undis slarm tcenter"><span></span></p><input type="text" class="txtinput tcenter ' + (_info.request_date != "" || _info.PF == 999 ? "" : "disabled") + '" size="10" rel="Request_Date" format="date" ' + (_info.request_date != "" || _info.PF == 999 ? "" : "disabled") + ' value="' + _info.request_date + '"></td>');
                                _html.push('<td><a class="icon-trash" title="Remove this item" id="btnRemoveItem"></a></td>');
                                _html.push('</tr>');

                                $("tr[rel='newitem']", currentDiv).before(_html.join(''));
                                var _tr = $("#OrderDetailTB tr[product_id='" + _info.product_id + "'][combination_id='" + _info.combination_id + "'][product_id='" + _info.product_id + "']", currentDiv);
                                $(_tr).data("info", _info);
                                var _stockInfo = $("div[rel='stockInfo']", _tr);
                                $(_stockInfo).html('');
                                $(_stockInfo).show();
                                $(_stockInfo).html('<p class="slarm"><i class="icon-spinner icon-spin mr5"></i>加载实时库存信息,请稍候...</p>');
                                _self.stockInfo(_info.product_id, _info.combination_id, _info.PF, $(_stockInfo), _info.locked);
                            }
                            initTrEvent();
                            $("#drpProduct", currentDiv).DropdownBoxReset();
                            checkSubmit();
                        }
                    });
                });

                function initTrEvent() {
                    $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                        var _tr = this;
                        $(_tr).click(function () {
                            $("div[rel='stockInfo']", currentDiv).hide();
                            $("#lblTips", currentDiv).hide();
                            $("div[rel='stockInfo']", this).show();
                            if ($(" #lblTips span", this).text() != "") {
                                $("#lblTips", this).show();
                            }
                        });
                        $("input[rel='Qty']", _tr).numeral({
                            onBlur: function (obj) {
                                var requestDate = $("input[rel='Request_Date']", _tr);
                                var dateTips = $("#lblTips", _tr);
                                var _info = $(_tr).data("info");
                                if (_info.PF != 999) {
                                    if ($(obj).val() != "") {
                                        if ($(obj).val() != $(obj).attr("old_qty")) {
                                            requestDate.attr("disabled", false);
                                            requestDate.removeClass("disabled");
                                            $(obj).attr("old_qty", $(obj).val());
                                            var startDate = _self.getRequestDate($(_tr).attr("combination_id"), $(obj).val(), _tr);
                                            requestDate.datetimepicker('setStartDate', startDate);
                                            $("span", dateTips).text("预计" + startDate + "交货");
                                            dateTips.show();
                                            requestDate.val('');
                                        }
                                    } else {
                                        requestDate.val('');
                                        requestDate.attr("disabled", true);
                                        requestDate.addClass("disabled");
                                        $("span", dateTips).text('');
                                        dateTips.hide();
                                    }
                                }
                                //$("span[rel='unit_price']", _tr).attr("unit_price") 
                                var _unitprice = (_info.PF != 999 ? $("#unit_price", _tr).val(): $("#unit_price", _tr).val());
                                $("span[rel='amount']", _tr).text($(obj).val() * _unitprice);
                                $("span[rel='amount']", _tr).attr("amount", $(obj).val() * _unitprice);
                                checkSubmit();
                                SubTotal();
                                $('[format="amount"]').formatCurrency();
                                UpdateDetail(_tr);
                            }
                        });
                        $("input[rel='Request_Date']", _tr).change(function () {
                            checkSubmit();
                            UpdateDetail(_tr);
                        });
                        $("input[rel='customer_part_number']", _tr).change(function () {
                            checkSubmit();
                            UpdateDetail(_tr);
                        });
                        $("#unit_price", _tr).numeral({
                            point: true,
                            onBlur: function (obj) {
                                $("span[rel='amount']", _tr).text($(obj).val() * $("input[rel='Qty']", _tr).val());
                                $("span[rel='amount']", _tr).attr("amount", $(obj).val() * $("input[rel='Qty']", _tr).val());
                                UpdateDetail(_tr);
                                SubTotal();
                                $('[format="amount"]').formatCurrency();
                                checkSubmit();
                            }
                        });
                    });
                    $("[format='date']").datetimepicker({
                        weekStart: 1,
                        todayBtn: 0,
                        autoclose: 1,
                        todayHighlight: 1,
                        startView: 2,
                        minView: 2,
                        format: "mm/dd/yyyy",
                        startDate: jsToday
                    });
                }

                initTrEvent();
                $("#HtmlBox").delegate("#btnRemoveItem", "click", function () {
                    var _tr = $(this).parents("tr");
                    var _info = $(_tr).data("info");
                    $.each(_details, function (i, detail) {
                        var _has = false;
                        if (detail.combination_id == _info.combination_id && detail.product_id == _info.product_id && detail.PF == _info.PF) {
                            _has = true;
                        }
                        if (_has) {
                            if (detail.order_detail_id == 0) {
                                _details.splice(i, 1);
                            } else {
                                detail.delete_ind = true;
                            }
                            return false;
                        }
                    });
                    $(_tr).remove();
                    checkSubmit();
                });

                $("#drpShipMethod", currentDiv).DropdownBox({
                    data: shipMethodData,
                    placeholder: "",
                    width: 80,
                    textFeilds: ["ship_method_name"],
                    valueFeild: "ship_method_id",
                    value: _orderInfo.ship_method_id,
                    onChange: function (data) {
                        if (data.ship_method_id == 3) {
                            $("#drpPortOrigin", currentDiv).parents("tr").hide();
                            $("#drpPortDestination", currentDiv).parents("tr").hide();
                            $("#drpPortOrigin", currentDiv).DropdownBoxReset();
                            $("#drpPortDestination", currentDiv).DropdownBoxReset();
                        } else {
                            $("#drpPortOrigin", currentDiv).parents("tr").show();
                            $("#drpPortDestination", currentDiv).parents("tr").show();
                        }
                        checkSubmit();
                    }
                });

                $("#drpShiper", currentDiv).DropdownBox({
                    data: localData.Shipper,
                    placeholder: "",
                    width: 150,
                    textFeilds: ["company_name"],
                    valueFeild: "company_id",
                    value: _orderInfo.ship_via_id,
                    onChange: function (data) {
                        checkSubmit();
                    }
                });

                $("#drpPortOrigin", currentDiv).DropdownBox({
                    data: localData.Ports,
                    placeholder: "",
                    width: 80,
                    textFeilds: ["port_name"],
                    valueFeild: "port_id",
                    value: _orderInfo.port_origin_id,
                    onChange: function (data) {
                        checkSubmit();
                    }
                });

                $("#drpPortDestination", currentDiv).DropdownBox({
                    data: localData.Ports,
                    placeholder: "",
                    width: 80,
                    textFeilds: ["port_name"],
                    valueFeild: "port_id",
                    value: _orderInfo.port_destination_id,
                    onChange: function (data) {
                        checkSubmit();
                    }
                });

                if (_orderInfo.ship_method_id == 3) {
                    $("#drpPortOrigin", currentDiv).parents("tr").hide();
                    $("#drpPortDestination", currentDiv).parents("tr").hide();
                } else {
                    $("#drpPortOrigin", currentDiv).parents("tr").show();
                    $("#drpPortDestination", currentDiv).parents("tr").show();
                }

                $("input[name='Rad_Sales_Fee'][value='" + _freight.mode + "']", currentDiv).attr("checked", true);
                if (_freight.mode == 0 && _freight.price != 0) $("#Sales_Fee", currentDiv).val(_freight.price);
                $("input[name='Rad_Sales_Fee']", currentDiv).change(function () {
                    _freight.mode = $(this).val();
                    _freight.price = 0;
                    var _sales_fee = $("#Sales_Fee", currentDiv);
                    if ($(this).val() == 0) {
                        _sales_fee.attr("disabled", false);
                        _sales_fee.removeClass("disabled");
                    } else {
                        _sales_fee.val('');
                        _sales_fee.attr("disabled", true);
                        _sales_fee.addClass("disabled");
                        if ($(this).val() == 1) _freight.note = "稍后计算";
                        if ($(this).val() == 2) _freight.note = "免运费";
                    }
                    checkSubmit();
                    countFeeAndTotal();
                });
                $("#Sales_Fee", currentDiv).numeral({ point: true, onBlur: function (obj) { countFeeAndTotal(); checkSubmit(); } });

                $("#Chk_Sales_Tax", currentDiv).change(function () {
                    if ($(this).attr("checked") == "checked") {
                        $("tr[rel='dataitem'][PF='1'] #unit_price", currentDiv).each(function () {
                            $(this).val(($(this).attr("unit_price") * 1).toFixed(2));
                            var _tr = $(this).parents("tr");
                            $("span[rel='amount']", _tr).text($(this).val() * 1 * $("input[rel='Qty']", _tr).val() * 1);
                            $("span[rel='amount']", _tr).attr("amount", $(this).val() * 1 * $("input[rel='Qty']", _tr).val() * 1);
                        });
                        _self.tax = true;
                    } else {
                        $("tr[rel='dataitem'][PF='1'] #unit_price", currentDiv).each(function () {
                            var _tr = $(this).parents("tr");
                            $(this).val(($(this).attr("unit_price") / 1.1).toFixed(2));
                            $("span[rel='amount']", _tr).text($(this).val() * 1 * $("input[rel='Qty']", _tr).val() * 1);
                            $("span[rel='amount']", _tr).attr("amount", $(this).val() * 1 * $("input[rel='Qty']", _tr).val() * 1);
                        });
                        _self.tax = false;
                    }
                    SubTotal();
                    $('[format="amount"]').formatCurrency();
                });

                function countFeeAndTotal() {
                    var _fee = $("#Sales_Fee", currentDiv).val() == "" ? 0 : $("#Sales_Fee", currentDiv).val();
                    _freight.price = _fee;
                    $("span[rel='total']", currentDiv).text(parseFloat($("span[rel='total']", currentDiv).attr("total")) + parseFloat(_fee));
                    $('[format="amount"]').formatCurrency();
                }

                function SubTotal() {
                    var _total_amount = 0;
                    var _total_qty = 0;
                    $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                        var thisPF = $(this).attr("PF");
                        var amount = $("span[rel='amount']", this).attr("amount");
                        _total_amount += (amount * 1);
                        _total_qty += ($("input[rel='Qty']", this).val() * 1);
                    });
                    $("span[rel='total']", currentDiv).attr("total", _total_amount);
                    $("span[rel='totalQty']", currentDiv).text(_total_qty);
                    countFeeAndTotal();
                }

                $("#ConfirmContractTerms", currentDiv).change(function () { checkSubmit(); });
                $("input", currentDiv).change(function () { checkSubmit(); });

                function checkSubmit() {
                    var check = true;
                    check = $("#address-box", currentDiv).CheckAddressInfo().check;
                    if ($("input[name='Rad_Sales_Fee']:checked", currentDiv).val() == 0 && $("#Sales_Fee", currentDiv).val() == "") {
                        check = false;
                    } else {
                        $("#Sales_Fee", currentDiv).removeClass("err");
                    }
                    if ($("#drpShipMethod", currentDiv).getDropdownSelect() == null) {
                        check = false;
                    } else {
                        $("#drpShipMethod .DropdownHead", currentDiv).removeClass("err");
                        if ($("#drpShipMethod", currentDiv).getDropdownSelect().ship_method_id != 3) {
                            if ($("#drpPortDestination", currentDiv).getDropdownSelect() == null) {
                                check = false;
                            } else {
                                $("#drpPortDestination .DropdownHead", currentDiv).removeClass("err");
                            }
                        }
                    }
                    if ($("#drpShiper", currentDiv).getDropdownSelect() == null) {
                        check = false;
                    } else {
                        $("#drpShiper .DropdownHead", currentDiv).removeClass("err");
                    }
                    
                    $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                        if ($("input[rel='Qty']", this).val() == "") {
                            check = false;
                        } else {
                            $("input[rel='Qty']", this).removeClass("err");
                        }
                        if ($("input[rel='Request_Date']", this).val() == "") {
                            check = false;
                        } else {
                            $("input[rel='Request_Date']", this).removeClass("err");
                        }
                    });
                    if ($("#ConfirmContractTerms:checked", currentDiv).length == 0) {
                        check = false;
                    } else {
                        $("#ConfirmContractTermsBox", currentDiv).removeClass("err");
                    }
                    if ($("#chkBlanket:checked", currentDiv).length > 0) {
                        if ($("#startDate", currentDiv).val() == "") {
                            check = false;
                        } else {
                            $("#startDate", currentDiv).removeClass("err");
                        }
                        if ($("#endDate", currentDiv).val() == "") {
                            check = false;
                        } else {
                            $("#endDate", currentDiv).removeClass("err");
                        }
                        if (!isEmail($("#BatchMailTo", currentDiv).val())) {
                            check = false;
                        } else {
                            $("#BatchMailTo", currentDiv).removeClass("err");
                        }
                    }
                    if ($("#OrderDetailTB tr[rel='dataitem']", currentDiv).length == 0) check = false;
                    $("#btnSalesOrderSubmit").changeStatus(check);
                }

                function checkError() {
                    $(".err").removeClass("err");
                    $("#address-box", currentDiv).CheckAddressInfo();
                    $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                        if ($("input[rel='Qty']", this).val() == "") $("input[rel='Qty']", this).addClass("err");
                        if ($("input[rel='Request_Date']", this).val() == "") $("input[rel='Request_Date']", this).addClass("err");
                    });
                    if ($("#chkBlanket:checked", currentDiv).length > 0) {
                        if ($("#startDate", currentDiv).val() == "") $("#startDate", currentDiv).addClass("err");
                        if ($("#endDate", currentDiv).val() == "") $("#endDate", currentDiv).addClass("err");
                        if (!isEmail($("#BatchMailTo", currentDiv).val())) $("#BatchMailTo", currentDiv).addClass("err");
                    }
                    if ($("input[name='Rad_Sales_Fee']:checked", currentDiv).val() == 0 && $("#Sales_Fee", currentDiv).val() == "") $("#Sales_Fee", currentDiv).addClass("err");
                    if ($("#drpShiper", currentDiv).getDropdownSelect() == null) $("#drpShiper .DropdownHead", currentDiv).addClass("err");
                    if ($("#ConfirmContractTerms:checked", currentDiv).length == 0) $("#ConfirmContractTermsBox", currentDiv).addClass("err");
                    if ($("#drpShipMethod", currentDiv).getDropdownSelect() == null) {
                        $("#drpShipMethod .DropdownHead", currentDiv).addClass("err");
                    } else {
                        if ($("#drpShipMethod", currentDiv).getDropdownSelect().ship_method_id != 3) {
                            if ($("#drpPortDestination", currentDiv).getDropdownSelect() == null) {
                                $("#drpPortDestination .DropdownHead", currentDiv).addClass("err");
                            }
                        }
                    }
                }

                function UpdateDetail(tr) {
                    var _info = $(tr).data("info");
                    $.each(_details, function (i, detail) {
                        if (detail.combination_id == _info.combination_id && detail.product_id == _info.product_id && detail.PF == _info.PF) {
                            if (detail.PF != 999) {
                                detail.qty = $("input[rel='Qty']", tr).val();
                                detail.customer_part_number = $("input[rel='customer_part_number']", tr).val();
                                detail.unit_price = $("#unit_price", tr).val();
                                detail.request_date = $("input[rel='Request_Date']", tr).val();
                            } else {
                                detail.qty = $("input[rel='Qty']", tr).val();
                                detail.customer_part_number = $("input[rel='customer_part_number']", tr).val();
                                detail.unit_price = $("#unit_price", tr).val();
                                detail.request_date = $("input[rel='Request_Date']", tr).val();
                            }
                        }
                    });
                }

                if (_self.order_id != 0) {//删除订单
                    $("#btnSalesOrderDelete", currentDiv).show();
                    $("#btnSalesOrderDelete", currentDiv).click(function () {
                        jConfirm("<div class='tcenter'>确定删除该订单？</div>", "删除订单",function (r) {
                            if (r) {
                                var order_info = { "order_id": _self.order_id, "order_guid": _orderInfo.order_guid };
                                order_info.PF = _orderInfo.PF;
                                order_info.PFID = _orderInfo.PFID;
                                var query = new Object();
                                query.OrderInfo = JSON.stringify(order_info);
                                $.ajax({
                                    type: "POST",
                                    contentType: "application/json",
                                    url: setting.WebService + "SalesOrder.asmx/DelSalesOrder",
                                    datatype: 'json',
                                    data: JSON.stringify(query),
                                    success: function (result) {
                                        var response = eval('(' + result.d + ')');
                                        $("#HtmlBox").unmask();
                                        if (response.flag) {
                                            location.hash = "!ProcessSales";
                                        } else {
                                            jAlert(response.message);
                                        }
                                    }
                                });
                            }
                        });
                    });
                }

                function Submit() {
                    //$("#HtmlBox").mask("正在提交数据...");
                    var _requestDate = [];
                    $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                        _requestDate.push($("input[rel='Request_Date']", this).val());
                    });
                    _requestDate.sort(function (a, b) {
                        if (a == b) {
                            return 0;
                        }
                        var dt1 = new Date(a.replace(/-/g, "/"));
                        var dt2 = new Date(b.replace(/-/g, "/"));
                        if (dt1.getTime() > dt2.getTime()) {
                            return -1;
                        }
                        else {
                            return 1;
                        }
                    });
                    var _subTotal = $("span[rel='total']", currentDiv).attr("total");
                    var charge_detail = { "Fees": [{ "name": "SHIPPING & HANDING", "qty": 0, "price": _freight.price.toString(), "mode": _freight.mode, "note": _freight.note }], "TOTAL": (parseFloat(_subTotal) + parseFloat(_freight.price)).toString(), "SUBTOTAL": _subTotal.toString() };

                    var _ship_method = $("#drpShipMethod", currentDiv).getDropdownSelect();
                    var _port_origin = $("#drpPortOrigin", currentDiv).getDropdownSelect();
                    var _port_destination = $("#drpPortDestination", currentDiv).getDropdownSelect();

                    var order_info = {
                        "type_name": "SO",
                        "order_id": _self.order_id,
                        "order_number": _self.order_id == 0 ? _orderInfo.new_order_number : _orderInfo.order_number,
                        "order_guid": _orderInfo.order_guid,
                        "order_date": _orderInfo.order_date,
                        "buyer_company_id": _orderInfo.buyer_company_id,
                        "buyer_company_code": _orderInfo.buyer_company_code,
                        "buyer_company": _orderInfo.buyer_info,
                        "buyer_purchase_number": $("#buyer_purchase_number", currentDiv).val(),
                        "ship_info":$("#address-box", currentDiv).getAddressInfo().value,
                        "payment_term_id": _orderInfo.payment_term_id,
                        "payment_term": _orderInfo.payment_term,
                        "currency": $("input[name='radCurrency']:checked", currentDiv).val(),
                        "ship_via_id": $("#drpShiper", currentDiv).getDropdownSelect().company_id,
                        "ship_via": $("#drpShiper", currentDiv).getDropdownSelect().company_name,
                        "ship_method": _ship_method,
                        "port_origin": _port_origin == null ? { port_id: 0, port_name: "" } : _port_origin,
                        "port_destination": _port_destination == null ? { port_id: 0, port_name: "" } : _port_destination,
                        "tax_ind": $("#Chk_Sales_Tax:checked", currentDiv).length == 0 ? false : true,
                        "term_note": $("#OrderContent", currentDiv).val(),
                        "charge_detail": charge_detail,
                        "total": (parseFloat(_subTotal) + parseFloat(_self.fee.amout)).toString(),
                        "request_date": _requestDate[0],
                        "bank": BankData[0],
                        "PF": _orderInfo.PF,
                        "PFID": _orderInfo.PFID
                    };
                    var _checkComplex = false;
                    $.each(_details, function (i, detail) {
                        detail.qty = detail.qty.toString();
                        detail.unit_price = detail.unit_price.toString();
                        if (detail.PF == 999) _checkComplex = true;
                    });
                    if (_checkComplex) order_info.PF = 9999;
                    var query = new Object();
                    query.OrderInfo = JSON.stringify(order_info);
                    query.OrderDetail = JSON.stringify(_details);
                    //$(currentDiv).html(JSON.stringify(order_info)); return;
                    $.ajax({
                        type: "POST",
                        contentType: "application/json",
                        url: setting.WebService + "SalesOrder.asmx/InsertOrder",
                        datatype: 'json',
                        data: JSON.stringify(query),
                        success: function (result) {
                            var response = eval('(' + result.d + ')');
                            $("#HtmlBox").unmask();
                            if (response.flag) {
                                location.hash = "!ProcessSales?soid=" + response.data.order_id + "&mode=SalesOrder&num=" + response.data.order_number + ($("#chkBlanket:checked", currentDiv).length > 0 ? "&batch=" + JSON.stringify(order_info.batch) : "");
                            } else {
                                jAlert(response.message);
                            }
                        }
                    });
                }
            }
        }
        //销售价格管理
        Sales.prototype.SalesPrice = function () {
            $("div[rel='Page']").hide();
            $("h2").text("产品采购价格管理");

            $("#HtmlBox").mask("加载数据");
            if (!modeControl.SalesPrice) {
                LoadData.GetProduct();
                $(document).queue("ModuleFun", function () { initSalesPrice(); });
                $(document).dequeue("ModuleFun");
            } else {
                initSalesPrice();
            }
            function initSalesPrice() {
                modeControl.SalesPrice = true;
                $("#HtmlBox").unmask();

                var currentDiv = $('<div rel="Page" relName="Sales_ProductPrice_Box"></div>');
                if ($('div[relName="Sales_ProductPrice_Box"]').length != 0) {
                    $('div[relName="Sales_ProductPrice_Box"]').show();
                    return false;
                }
                $(currentDiv).appendTo("#HtmlBox");

                var html = [];
                html.push('<div class="tcenter" style="width:550px; margin:0px auto; min-height:550px;"><p class="mt tleft"><span id="ProductSearch"></span></p><div class="mt20 blocktb" id="listBox"></div>');
                html.push('<div style="position:fixed;bottom:1px;background:#fff; z-index:999px; padding:10px; width:530px;" class="tright"><span id="btnUpdate">更新</span></div>');
                html.push('</div>');
                $(currentDiv).html(html.join(''));

                $("#ProductSearch", currentDiv).SearchBox({ SearchTips: false, width: 320, data: localData.Product, SearchFeilds: ["product_number", "product_name_chinese"], onSearch: function (data) { initList(data); } });
                $("#btnUpdate", currentDiv).Button({ onClick: function () { Update(); } });
                var SubmitData = [];

                function initList(data) {
                    html = [];
                    html.push('<table width="100%" class="tb" id="SalesPriceTb">');
                    html.push('<tr class="bg"><th width="150px">型号</th><th width="400px">销售价设置</th></tr>');
                    html.push('</table>');
                    $("#listBox", currentDiv).html(html.join(''));
                    $.each(data, function (i, info) {
                        var _tr = $('<tr align="center" rel="dataitem" product_id="' + info.product_id + '" PF="' + info.PF + '"></tr>');
                        $(_tr).html('<td><a>' + info.product_number + (info.PF == 999 ? "(老系统)" : "") + '</a></td><td></td>');
                        $("#SalesPriceTb tr:last", currentDiv).after(_tr);
                        $(_tr).data("sales_price", info.price);
                        var old_sales_price = [];
                        $.each(info.price, function (i, _price) {
                            old_sales_price.push(jQuery.extend(true, {}, _price));
                        });
                        $(_tr).data("old_sales_price", old_sales_price);
                    });
                    initSalesPrice();
                }

                function initSalesPrice() {
                     $("#SalesPriceTb tr[rel='dataitem']", currentDiv).each(function () {
                        var _tr = this;
                        var sales_price = $(_tr).data("sales_price");
                        html = [];
                        html.push('<table width="100%"><tr><th>销售价分类</th><th>销售单价(￥)</th></tr>');
                        $.each(sales_price, function (j, _price) {
                            html.push('<tr align="center" rel="subdataitem"><td width="270px" align="left"><span class="w70">' + _price.typename + '</span><span class="color969696 ml5">(' + _price.desc + ')</span>' + '</td><td><input type="text" class="txtinput" size="6" rel="price" oldprice="' + _price.price + '"  relindex="' + j + '" value="' + _price.price + '"></td></tr>');
                        });
                        html.push('</table>');
                        $("td:eq(1)", _tr).html(html.join(''));
                     });
                     $("#SalesPriceTb input[rel='price']", currentDiv).numeral({
                         point: true, onBlur: function (obj) {
                             var _ptr = $(obj).parents("tr[rel='dataitem']");
                             var sales_price = $(_ptr).data("sales_price");
                             var _tmpSalesPrice = sales_price[$(obj).attr("relindex")];
                             _tmpSalesPrice.price = $(obj).val() == "" ? 0 : $(obj).val();
                             CheckSubmit();
                         }
                     });
                }
                function CheckSubmit() {
                    var _check = false;
                     $("tr[rel='subdataitem']", currentDiv).each(function () {
                        if ($("input[rel='Price']", this).val() != $("input[rel='Price']", this).attr("oldprice") && $("input[rel='Price']", this).val() != "") { _check = true; }
                    });
                    $("#btnUpdate", currentDiv).changeStatus(_check);
                }

                function Update() {
                    var html = [];
                    html.push('<div class="blocktb" style="height:400px;overflow-y:auto;"><table width="850px" id="ConfirmTb" class="tb" align="center"><tr class="bg"><th width="120px" rowspan="2" class="line13">型号</th><th width="530px" colspan="2" class="line13">销售价</th></tr><tr class="bg"><th width="370px" class="line13">Before</th><th width="370px" class="line13">Now</th></tr>');
                    $("tr[rel='dataitem']", currentDiv).each(function () {
                        var _tr = this;
                        var sales_price = $(_tr).data("sales_price");
                        var old_sales_price = $(_tr).data("old_sales_price");
                        var has_change = false;
                        $("tr[rel='subdataitem']",_tr).each(function () {
                            if ($("input[rel='Price']", this).val() != $("input[rel='Price']", this).attr("oldprice") && $("input[rel='Price']", this).val() != "") {
                                has_change = true;
                            };
                        });
                        if (has_change) {
                            html.push('<tr>');
                            html.push('<td align="center">' + $("td:eq(0)", this).text() + '</td><td align="center">');
                            html.push('<table width="100%"><tr><th>销售价分类</th><th>销售单价(￥)</th></tr>');
                            $.each(old_sales_price, function (j, _price) {
                                html.push('<tr align="center"><td align="left"><span class="w70">' + _price.typename + '</span><span class="color969696 ml5">(' + _price.desc + ')</span></td><td>' + _price.price + '</td></tr>');
                            });
                            html.push('</table>');
                            html.push('</td><td align="center">');
                            html.push('<table width="100%"><tr><th>销售价分类</th><th>销售单价(￥)</th></tr>');
                            $.each(sales_price, function (j, _price) {
                                html.push('<tr align="center"><td align="left"><span class="w70">' + _price.typename + '</span><span class="color969696 ml5">(' + _price.desc + ')</span></td><td>' + _price.price + '</td></tr>');
                            });
                            html.push('</table>');
                            html.push('</td>');
                            html.push('</tr>');
                            var _info = {
                                product_id: $(this).attr("product_id"),
                                price: sales_price,
                                PF: $(this).attr("PF")
                            }
                            SubmitData.push(_info);
                        }
                    });
                    html.push('</table></div>');
                    html.push('<div class="mt20 tright"><span class="btn2" id="btnReorderLevelCancel">取消</span><span class="btn1 ml" id="btnReorderLevelSubmit">提交</span></div>');

                    $(document.body).Dialog({ title: "确认修改", content: html.join(''), width: 900 });
                    $("#btnReorderLevelCancel").click(function () { $(document.body).unDialog(); });
                    $("#btnReorderLevelSubmit").click(function () { Submit(); });
                }

                function Submit() {
                    $("#HtmlBox").mask("正在提交数据...");
                    var query = new Object();
                    query.SubmitData = JSON.stringify(SubmitData);
                    $.ajax({
                        type: "POST",
                        contentType: "application/json",
                        url: setting.WebService + "Product.asmx/UpdateProductPrice",
                        datatype: 'json',
                        data: JSON.stringify(query),
                        success: function (result) {
                            $("#HtmlBox").unmask();
                            $(document.body).unDialog();
                            var response = eval('(' + result.d + ')');
                            if (response.flag) {
                                $.each(localData.Product, function (i, info) {
                                    $.each(SubmitData, function (j, _info) {
                                        if (info.product_id == _info.product_id) {
                                            info.price = _info.price;
                                            $("tr[product_id='" + _info.product_id + "'] span[rel='OrgPrice']", currentDiv).text(_info.price);
                                        }
                                    });
                                });
                                SubmitData = [];
                                $("#btnReorderLevelUpdate", currentDiv).changeStatus(false);
                            } else {
                                alert(response.message);
                            }
                        }
                    });


                }
            }
        }
        //财务手工放行
        Sales.prototype.SalesAccountAllow = function () {
            $("div[rel='Page']").hide();
            $("h2").text("销售订单财务手工放行管理");
            var currentDiv = $('<div rel="Page" relName="Sales_SalesAccountAllow_Box"></div>');
            if ($('div[relName="Sales_SalesAccountAllow_Box"]').length != 0) {
                $('div[relName="Sales_SalesAccountAllow_Box"]').show();
                return false;
            }
            $(currentDiv).appendTo("#HtmlBox");
            $("#HtmlBox").mask("加载数据");
            var data = [];
            $(document).queue("ModuleFun", function () {
                $.ajax({
                    type: "POST",
                    contentType: "application/json",
                    url: setting.WebService + "SalesOrder.asmx/GetSalesPendingAccountAllow",
                    datatype: 'json',
                    success: function (result) {
                        data = eval('(' + result.d + ')');
                        $(document).dequeue("ModuleFun");
                    }
                });
            });
            $(document).queue("ModuleFun", function () { initSalesAccountAllow(); });
            $(document).dequeue("ModuleFun");
            function initSalesAccountAllow() {
                $("#HtmlBox").unmask();

                var html = [];
                html.push('<div class="tcenter" style="width:550px; margin:0px auto; min-height:550px;"><div class="mt20 blocktb" id="listBox">');
                html.push('<table width="100%" class="tb" id="SalesAccountAllowTB">');
                html.push('<tr class="bg"><th width="80px">订单号</th><th width="200px">客户名称</th><th>可放行金额</th><th>放行金额</th><th></th></tr>');
                html.push('</table>');
                html.push('</div>');
                html.push('</div>');
                $(currentDiv).html(html.join(''));
                $.each(data, function (i, info) {
                    var _html = '<tr align="center" rel="dataitem" order_id="' + info.order_id + '" country_id="' + info.country_id + '" PF="' + info.PF + '" PFID="' + info.PFID + '" order_guid="' + info.order_guid + '">';
                    _html += '<td><a report="salesorder" soid="' + info.order_id + '">' + info.order_number + '</a></td><td align="left">' + info.buyer_info.company_name + '</td><td align="right"><span format="amount" pending_quota="' + parseFloat(info.quota).toFixed(2) + '" rel="pending_quota">' + info.quota + '</span></td><td><input type="text" class="txtinput tcenter" size="6" rel="allow_quota"></td><td><span class="btn3" rel="btnSave">财务放行</span></td></tr>';
                    $("#SalesAccountAllowTB tr:last", currentDiv).after(_html);
                    $("#SalesAccountAllowTB tr[product_id='" + info.product_id + "']", currentDiv).data("info", info);
                });
                $('[format="amount"]').formatCurrency();
                $("#SalesAccountAllowTB tr[rel='dataitem']", currentDiv).each(function () {
                    var _tr = this;
                    $("input[rel='allow_quota']", _tr).numeral({
                        point: true,
                        onBlur: function (obj) {
                            if (parseFloat($(obj).val()) > parseFloat($("span[rel='pending_quota']", _tr).attr("pending_quota"))) {
                                $(obj).val($("span[rel='pending_quota']", _tr).attr("pending_quota"));
                            }
                            $("span[rel='btnSave']", _tr).changeStatus($(obj).val() != "" ? true : false);
                        }
                    });
                    $("span[rel='btnSave']", _tr).Button({
                        Submit: false,
                        onClick: function () {
                            jConfirm('确认为<span class="red">' + $("td:eq(1)", _tr).text() + '</span>的<span class="red">' + $("td:eq(0) a", _tr).text() + '</span>订单更改放行金额：<span class="red">' + $("input[rel='allow_quota']", _tr).val() + '</span> ?', "财务放行确认", function (r) {
                                if (r) {
                                    $("#HtmlBox").mask('正在提交数据，请稍候...');
                                    var query = new Object();
                                    query.order_id = $(_tr).attr("order_id");
                                    query.checkout_quota = $("input[rel='allow_quota']", _tr).val();
                                    $.ajax({
                                        type: "POST",
                                        contentType: "application/json",
                                        url: setting.WebService + "SalesOrder.asmx/InsertCheckOutQuota",
                                        datatype: 'json',
                                        data: JSON.stringify(query),
                                        success: function (result) {
                                            var response = eval('(' + result.d + ')');
                                            $("#HtmlBox").unmask();
                                            if (response.flag) {
                                                _self.step = "";
                                                _self.Reset();
                                                location.hash = "!ProcessSales?soid=" + query.order_id + "&mode=CheckOutQuota";
                                            } else {
                                                jAlert(response.message);
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
                
            }
        }
        //销售库存管理
        Sales.prototype.SaleStockLocked = function () {
            $("div[rel='Page']").hide();
            $("h2").text("销售订单库存锁定管理");
            var currentDiv = $('<div rel="Page" relName="Sales_SaleStockLocked_Box"></div>');
            if ($('div[relName="Sales_SaleStockLocked_Box"]').length != 0) {
                $('div[relName="Sales_SaleStockLocked_Box"]').show();
                return false;
            }
            $(currentDiv).appendTo("#HtmlBox");

            var listdata = [];
            $(document).queue("ModuleFun", function () {
                $.ajax({
                    type: "POST",
                    contentType: "application/json",
                    url: setting.WebService + "SalesOrder.asmx/GetLockedSalesDetail",
                    datatype: 'json',
                    success: function (result) {
                        listdata = eval('(' + result.d + ')');
                        $(document).dequeue("ModuleFun");
                    }
                });
            });
            $(document).queue("ModuleFun", function () { initSaleStockLocked(); });
            $(document).dequeue("ModuleFun");
            function initSaleStockLocked() {
                var html = [];
                html.push('<div class="blocktb mt">');
                html.push('<div class="fixedbox" id="fixedbox">');
                html.push('<div class="mb"><p class="mt"><span id="ProductSearch"></span></p></div>');
                html.push('<table width="1160px" class="tb fixed">');
                html.push('<tr class="bg"><th width="250px">型号</th><th width="200px">客户</th><th width="100px">订单号</th><th width="100px">订单总量</th><th width="100px">已出库总量</th><th width="100px">订单库存锁定量</th><th width="100px">交货日期</th></tr>');
                html.push('</table></div>');
                html.push('<div id="fiexedboxlist"><table width="1160px" class="tb datalist fixed" id="SalesProcessTb"></table></div>');
                html.push('<div style="position:fixed;bottom:1px;background:#fff; z-index:999px; padding:10px; width:1150px;" class="tright"><span id="btnUpdate">更新</span></div>');
                html.push('</div>');
                $(currentDiv).html(html.join(''));

                $("#HtmlBox").unmask();
                $("#ProductSearch", currentDiv).SearchBox({ width: 400, data: listdata, SearchFeilds: ["sku"], onSearch: function (data) { initList(data); } });
                $("#btnUpdate", currentDiv).Button({ onClick: function () { Update(); } });
                InitFixBoxListPaddingTop(currentDiv);
                initList(listdata)
                function initList(data) {
                    html = [];
                    $.each(data, function (i, info) {
                        html.push('<tr align="center" rel="dataitem" order_detail_id="' + info.order_detail_id + '">');
                        html.push('<td width="250px" align="left">' + info.sku + '<p class="color969696">' + info.product_full_name + '</p></td>');
                        html.push('<td width="200px" align="left">' + info.buyer_info.company_name + '</td>');
                        html.push('<td width="100px">' + info.order_number + '</td>');
                        html.push('<td width="100px">' + info.qty_order + '</td>');
                        html.push('<td width="100px">' + info.qty_shipping + '</td>');
                        html.push('<td width="100px"><input type="text" rel="Qty" class="txtinput tcenter" value="' + info.qty_backordered + '" size="5" /><span class="w30 color969696 ml tleft" rel="OrgQty">' + info.qty_backordered + '</span></td>');
                        html.push('<td width="100px">' + info.request_date + '</td>');
                        html.push('</tr>')
                    });
                    $("#SalesProcessTb", currentDiv).html(html.join(''));
                    $("#SalesProcessTb", currentDiv).rowSpan(0);
                    $("input[rel='Qty']", currentDiv).numeral({ point: true, onKeyup: function (obj) { CheckSubmit(obj); } });
                }
            }
            function CheckSubmit(obj) {
                var _check = false;
                $("tr[rel='dataitem']", currentDiv).each(function () {
                    if ($("input[rel='Qty']", this).val() != $("input[rel='Qty']", this).next().text() && $("input[rel='Qty']", this).val() != "") { _check = true; }
                });
                $("#btnUpdate", currentDiv).changeStatus(_check);
            }

            function Update() {
                var html = [];
                var SubmitData = [];
                html.push('<div class="blocktb" style="height:400px;overflow-y:auto;"><table width="750px" id="ConfirmTb" class="tb" align="center"><tr class="bg"><th width="250px" rowspan="2" class="line13">型号</th><th width="250px" rowspan="2" class="line13">客户</th><th width="100px" rowspan="2" class="line13">订单号</th><th width="200px" colspan="2" class="line13">订单库存锁定量</th></tr><tr class="bg"><th width="100px" class="line13">Before</th><th width="100px" class="line13">Now</th></tr>');
                $("tr[rel='dataitem']", currentDiv).each(function () {
                    if ($("input[rel='Qty']", this).val() != $("input[rel='Qty']", this).next().text() && $("input[rel='Qty']", this).val() != "") {
                        html.push('<tr>');
                        html.push('<td align="left">' + $("td:eq(0)", this).html() + '</td><td>' + $("td:eq(1)", this).html() + '</td><td align="center">' + $("td:eq(2)", this).html() + '</td><td align="center">' + $("input[rel='Qty']", this).next().text() + '</td><td align="center">' + $("input[rel='Qty']", this).val() + '</td>');
                        html.push('</tr>');
                        var _info = {
                            order_detail_id: $(this).attr("order_detail_id"),
                            qty_backordered: $("input[rel='Qty']", this).val()
                        }
                        SubmitData.push(_info);
                    }
                });
                html.push('</table></div>');
                html.push('<div class="mt20 tright"><span class="btn2" id="btnReorderLevelCancel">取消</span><span class="btn1 ml" id="btnReorderLevelSubmit">提交</span></div>');

                $(document.body).Dialog({ title: "确认修改", content: html.join(''), width: 800 });
                $("#btnReorderLevelCancel").click(function () { $(document.body).unDialog(); });
                $("#btnReorderLevelSubmit").click(function () { Submit(SubmitData); });
            }

            function Submit(data) {
                $("#HtmlBox").mask("正在提交数据...");
                var query = new Object();
                query.data = JSON.stringify(data);
                $.ajax({
                    type: "POST",
                    contentType: "application/json",
                    url: setting.WebService + "SalesOrder.asmx/UpdateSaleStockLocked",
                    datatype: 'json',
                    data: JSON.stringify(query),
                    success: function (result) {
                        $("#HtmlBox").unmask();
                        $(document.body).unDialog();
                        var response = eval('(' + result.d + ')');
                        if (response.flag) {
                            $.each(listdata, function (i, info) {
                                $.each(data, function (j, _info) {
                                    if (info.order_detail_id == _info.order_detail_id) {
                                        info.qty_backordered = _info.qty_backordered;
                                        $("tr[order_detail_id='" + _info.order_detail_id + "'] span[rel='OrgQty']", currentDiv).text(_info.qty_backordered);
                                    }
                                });
                            });
                            $("#btnUpdate", currentDiv).changeStatus(false);
                        } else {
                            alert(response.message);
                        }
                    }
                });
            }
        }
        //年订单（客户采购计划）
        Sales.prototype.ClientPlanSales = function () {
            var currentObj = this;
            $("div[rel='Page']").hide(); 
            $("h2").text('编辑年订单');

            var currentDiv = $('<div rel="Page" relName="ClientPlanSales_Edit_Box"></div>');
            if ($("div[relName='ClientPlanSales_Edit_Box']").length != 0) {
                $("div[relName='ClientPlanSales_Edit_Box']").remove();
            }
            $(currentDiv).appendTo("#HtmlBox");

            var plantype = [{ id: 1, name: "3个月", value: 3 }, { id: 2, name: "半年", value: 6 }, { id: 3, name: "一年", value: 12 }];
            var planqtytype = [{ id: 1, name: "总量" }, { id: 2, name: "每月量" }];
            var planbatchtype = [{ id: 1, name: "每月", value: 1 }, { id: 2, name: "每2月", value: 2 }, { id: 3, name: "每3月", value: 3 }];//当选择3个月期限时，只能出现每月选项
            
            var _plan_sales_id = getUrlParam("psid") == null ? 0 : getUrlParam("psid");
            var orderinfo = null;
            var details = [];
            var buyer_purchase_number = "";
            var _current_company = null;
            currentObj.process_ind = false;
            currentObj.current_plan_type = plantype[0];
            currentObj.current_batch_type = planbatchtype[0];
            currentObj.batchs = [];

            LoadData.GetFlatProduct();
            LoadData.GetCompany(1);
            $(document).queue("ModuleFun", function () {
                $.ajax({
                    type: "POST",
                    contentType: "application/json",
                    url: setting.WebService + "SalesOrder.asmx/GetNewClientBuyerPurchaseNumber",
                    datatype: 'json',
                    success: function (result) {
                        buyer_purchase_number = result.d;
                        $(document).dequeue("ModuleFun");
                    }
                });
            });
            if (_plan_sales_id != 0) {
                $(document).queue("ModuleFun", function () {
                    var query = new Object();
                    query.order_id = _plan_sales_id;
                    $.ajax({
                        type: "POST",
                        contentType: "application/json",
                        url: setting.WebService + "SalesOrder.asmx/GetClientPOSalesInfo",
                        datatype: 'json',
                        data: JSON.stringify(query),
                        success: function (result) {
                            var _data = eval('(' + result.d + ')');
                            orderinfo = _data.info;
                            details = _data.details;
                            currentObj.batchs = _data.batchs;
                            _self.tax = orderinfo.tax_ind;
                            buyer_purchase_number = orderinfo.buyer_purchase_number;
                            currentObj.process_ind = orderinfo.process_ind;
                            $(document).dequeue("ModuleFun");
                        }
                    });
                });
            }
            $(document).queue("ModuleFun", function () { initClientPlanSales(); });
            $(document).dequeue("ModuleFun");
            
            function initClientPlanSales() {
                var html = [];
                html.push('</div><div style="position:fixed;top:45px;margin-left:990px;z-index:9;" id="Sales_CatListBox"><span id="btnSearchHistoryForClient" class="btn1">客户历史订购产品查询</span></div>');
                html.push('<p class="mt5"><span class="w110 tright">客户名称：</span><span id="drpCompany"></span></p>');
                if (_plan_sales_id != 0) {
                    html.push('<p class="mt5"><span class="w110 tright">客户采购计划号：</span>' + orderinfo.order_number + '</p>');
                }
                html.push('<p class="mt5"><span class="w110 tright">客户采购单号：</span>' + (currentObj.process_ind ? buyer_purchase_number : "") + '<input type="text" class="txtinput' + (currentObj.process_ind ? " undis" : "") + '" value="' + buyer_purchase_number + '" id="buyer_purchase_number"></p>');
                html.push('<p class="mt5"><span class="w110 tright">订单日期：</span>' + (_plan_sales_id == 0 ? jsToday : orderinfo.order_date) + '</p>');

                //选择订单期限
                html.push('<p class="mt5"><span class="w110 tright">订单期限：</span><span id="drpPlantype"></span><span></span></p>');

                html.push('<div class="blocktb mt">');
                html.push('<table class="tb" width="100%" id="OrderDetailTB">');
                html.push('<tr class="bg"><th width="100px">型号</th><th width="150px">客户型号</th><th>规格</th><th width="180px">订购数量</th><th width="120px">单价(元/卷)<e class="ml" rel="checkbox"><input type="checkbox" ' + (_self.tax ? " checked" : "") + ' class="mr5" id="Chk_Sales_Tax">含税</e></th><th width="80px">金额(元)</th><th width="20px"></th></tr>');

                html.push('<tr align="center" rel="newitem"><td colspan="3"><span id="drpProduct"></span></td><td></td><td></td><td></td><td></td></tr>');
               
                html.push('<tr align="center" class="fontBold"><td colspan="3">总计</td><td><span rel="totalQty">0</span></td><td></td><td><span format="amount" rel="total">0</span></td><td></td></tr>');
                html.push('</table>');

                html.push('<div class="mt"><p>发货批次:<span id="drpBatchType" class="ml"></span><span class="ml"></span><span class="ml">' + (currentObj.process_ind || _plan_sales_id == 0 ? '' : '<a id="btnReProcessBatch">重新生成发货批次</a>') + '</span></p><div class="mt" id="batchBox">');
                html.push('<table class="tb"  width="70%" id="batchTB"">');
                html.push('<tr><th width="60px">交货批次</th><th width="80px">批次交货日期</th><th width="100px">型号</th><th>规格</th><th width="80px">交货数量</th><th width="30px"></th></tr>');
                html.push('</table>');
                html.push('</div></div>');

                var _tempContent = orderinfo == null ? tempContent : orderinfo.term_note;
                html.push('<div class="mt"><p><a id="btnShowUndis" isShow="true">合同条款<i class="icon-caret-down ml5"></i></a></p><p id="showUndisBox"><textarea id="OrderContent">' + _tempContent + '</textarea></p></div>');
                html.push('<div class="mt tright"><span class="p2" id="ConfirmContractTermsBox"><input type="checkbox" id="ConfirmContractTerms"> 合同条款已经阅读并确认</span></div>');
                html.push('<div class="mt cf">' + (_plan_sales_id == 0 || currentObj.process_ind ? "" : '<div class="left"><span id="btnSalesOrderDelete" class="btn2 undis">删除</span></div>') + '<div class="right"><span id="btnSalesOrderSubmit">保存</span></div></div>');
                html.push('</div>');

                $(currentDiv).html(html.join(''));
                if (orderinfo != null) {
                    $.each(details, function (i, detail) {
                        var _tr = $('<tr rel="dataitem" align="center" product_id="' + detail.product_id + '" combination_id="' + detail.combination_id + '" PF="' + detail.PF + '"></tr>');
                        var _html = [];
                        _html.push('<td>' + detail.sku + '</td>');
                        _html.push('<td align="left"><input type="text" class="txtinput" size="15" rel="customer_part_number" value="' + detail.customer_part_number + '"></td>');
                        _html.push('<td align="left">' + detail.description + '</td>');
                        _html.push('<td>' + (orderinfo.process_ind ? parseInt(detail.qty) : '<span id="drpQtyType" class="mr5"></span>') + '<input type="text" class="txtinput tcenter ' + (orderinfo.process_ind ? 'undis' : '') + '" size="5" format="number" rel="Qty" value="' + parseInt(detail.qty) + '"><p id="qtymsg" class="undis mt5 alarm"></p></td>');
                        _html.push('<td><input type="text" class="txtinput" size="6" unit_price="' + detail.unit_price + '" value="' + detail.unit_price + '" id="unit_price"></td>');
                        _html.push('<td><span rel="amount" format="amount" amount="' + (detail.qty * detail.unit_price) + '">' + (detail.qty * detail.unit_price) + '</span></td>');
                        _html.push('<td>' + (orderinfo.process_ind ? '<i class="icon-trash color969696"></i>' : '<a class="icon-trash" title="Remove this item" id="btnRemoveItem"></a>') + '</td>');
                        _html.push('</tr>');
                        $(_tr).html(_html.join(''));
                        $("tr[rel='newitem']:last", currentDiv).before(_tr);
                        $(_tr).data("info", detail);
                    });
                    SubTotal();
                    ProcessBatchHtml();

                    if (orderinfo.process_ind) {
                        $("tr[rel='newitem']", currentDiv).hide();
                        $("#drpPlantype", currentDiv).hide();
                        $("#drpBatchType", currentDiv).hide();
                        $("#drpPlantype", currentDiv).next().text(orderinfo.order_term.name);
                        $("#drpBatchType", currentDiv).next().text(orderinfo.batch_type.name);
                    }
                    $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                        var _tr = this;
                        $("#drpQtyType", _tr).DropdownBox({
                            data: planqtytype,
                            width: 35,
                            textFeilds: ["name"],
                            valueFeild: "id",
                            value: 1,
                            onChange: function (data) {
                                processBatch(_tr);
                            }
                        });
                    });
                }

                $("#drpPlantype", currentDiv).DropdownBox({
                    data: plantype,
                    width: 30,
                    textFeilds: ["name"],
                    valueFeild: "id",
                    value:currentObj.current_plan_type.id,
                    onChange: function (data) {
                        currentObj.current_plan_type = data;
                        if (data.id == 1) {
                            $("#drpBatchType", currentDiv).hide();
                            $("#drpBatchType", currentDiv).next().text(planbatchtype[0].name);
                            currentObj.current_batch_type = $("#drpBatchType", currentDiv).SetDropdownDefault(1);
                        } else {
                            $("#drpBatchType", currentDiv).show();
                            $("#drpBatchType", currentDiv).next().text('');
                            var id = data.id == 2 ? 2 : 3;
                            currentObj.current_batch_type = $("#drpBatchType", currentDiv).SetDropdownDefault(id);
                        }
                        $("#btnReProcessBatch", currentDiv).hide();
                        currentObj.batchs = [];
                        processBatch();
                    }
                });
                $("#drpBatchType", currentDiv).DropdownBox({
                    data: planbatchtype,
                    width: 35,
                    textFeilds: ["name"],
                    valueFeild: "id",
                    value: 1,
                    onChange: function (data) {
                        currentObj.current_batch_type = data;
                        processBatch();
                    }
                });

                if (currentObj.current_plan_type.id == 1) {
                    $("#drpBatchType", currentDiv).hide();
                    $("#drpBatchType", currentDiv).next().text(currentObj.current_batch_type.name);
                }


                $("#btnSearchHistoryForClient").click(function () {
                    _self.SearchOrderHistory();
                });

                $("#Chk_Sales_Tax", currentDiv).change(function () {
                    if ($(this).attr("checked") == "checked") {
                        $("tr[rel='dataitem'][PF='1'] #unit_price", currentDiv).each(function () {
                            $(this).val($(this).attr("unit_price"));
                            var _tr = $(this).parents("tr");
                            $("span[rel='amount']", _tr).text($(this).val() * 1 * $("input[rel='Qty']", _tr).val() * 1);
                            $("span[rel='amount']", _tr).attr("amount", $(this).val() * 1 * $("input[rel='Qty']", _tr).val() * 1);
                        });
                        _self.tax = true;
                    } else {
                        $("tr[rel='dataitem'][PF='1'] #unit_price", currentDiv).each(function () {
                            var _tr = $(this).parents("tr");
                            $(this).val(($(this).attr("unit_price") / 1.1).toFixed(2));
                            $("span[rel='amount']", _tr).text($(this).val() * 1 * $("input[rel='Qty']", _tr).val() * 1);
                            $("span[rel='amount']", _tr).attr("amount", $(this).val() * 1 * $("input[rel='Qty']", _tr).val() * 1);
                        });
                        _self.tax = false;
                    }
                    SubTotal();
                    $('[format="amount"]').formatCurrency();
                });

                var _editor = $("#OrderContent", currentDiv).cleditor()[0];
                $("#showUndisBox").hide();
                $("#btnShowUndis", currentDiv).click(function () {
                    if ($(this).attr("isShow") == "true") {
                        $("#showUndisBox").show();
                        $(this).attr("isShow", "false");
                    } else {
                        $("#showUndisBox").hide();
                        $(this).attr("isShow", "true");
                    }
                });
                $("#ConfirmContractTerms", currentDiv).click(function () { checkSubmit(); });
                $('[format="amount"]').formatCurrency();

                if (_plan_sales_id == 0) {
                    $("#drpCompany", currentDiv).DropdownBox({
                        data: localData.CustomerData,
                        width: 300,
                        search: true,
                        textFeilds: ["company_code", "company_name"],
                        valueFeild: "company_id",
                        onChange: function (data) {
                            _current_company = data;
                            $("#OrderContent", currentDiv).val(tempContent.replace("{payment}", _current_company.payment_term));
                            _editor.updateFrame();
                            checkSubmit();
                        }
                    });
                } else {
                    _current_company = orderinfo.buyer_info;
                    $("#drpCompany", currentDiv).html(_current_company.company_name);
                }

                $("#HtmlBox").delegate("#btnRemoveItem", "click", function () {
                    var _tr = $(this).parents("tr");
                    DeleteBatchDetail(_tr);
                    $(_tr).remove();
                    ProcessBatchHtml();
                    checkSubmit();
                });

                $("#HtmlBox").delegate("a[rel='delBatch']", "click", function () {
                    var _tr = $(this).parents("tr");
                    $("td:eq(2)", _tr).addClass("bgf1ff1 color969696 throughline");
                    $("td:eq(3)", _tr).addClass("bgf1ff1 color969696 throughline");
                    $("td:eq(4)", _tr).addClass("bgf1ff1 color969696 throughline");
                    $("input[rel='batch_qty']", _tr).val('0');
                    $("input[rel='batch_qty']", _tr).hide();
                    $("a.icon-trash", _tr).hide();
                    $("a.undo", _tr).show();
                    UpdateBatchDetail(_tr, true);
                    CheckBatchQty($(_tr).attr("combination_id"));
                    var _batch = $(_tr).attr("batch");
                    if (GetBatchDetailAvailable(_batch) == 1 && !currentObj.process_ind) {
                        $("#batchTB tr[batch='" + _batch + "'] a.icon-trash", currentDiv).removeAttr("title");
                        $("#batchTB tr[batch='" + _batch + "'] a.icon-trash", currentDiv).removeAttr("rel");
                        $("#batchTB tr[batch='" + _batch + "'] a.icon-trash", currentDiv).addClass("color969696");
                    }
                    checkSubmit();
                });
                $("#HtmlBox").delegate("i[rel='delRecovery']", "click", function () {
                    var _tr = $(this).parents("tr");
                    $("td:eq(2)", _tr).removeClass("bgf1ff1 color969696 throughline");
                    $("td:eq(3)", _tr).removeClass("bgf1ff1 color969696 throughline");
                    $("td:eq(4)", _tr).removeClass("bgf1ff1 color969696 throughline");
                    $("input[rel='batch_qty']", _tr).val('');
                    $("input[rel='batch_qty']", _tr).show();
                    $("a.icon-trash", _tr).show();
                    $("a.undo", _tr).hide();
                    UpdateBatchDetail(_tr, false);
                    CheckBatchQty($(_tr).attr("combination_id"));
                    var _batch = $(_tr).attr("batch");
                    if (GetBatchDetailAvailable(_batch) > 1) {
                        $("#batchTB tr[batch='" + _batch + "'] a.icon-trash", currentDiv).attr("title", "Remove this item");
                        $("#batchTB tr[batch='" + _batch + "'] a.icon-trash", currentDiv).attr("rel", "delBatch");
                        $("#batchTB tr[batch='" + _batch + "'] a.icon-trash", currentDiv).removeClass("color969696");
                    }
                    checkSubmit();
                });

                $("#btnReProcessBatch",currentDiv).click(function () {
                    currentObj.batchs = [];
                    processBatch();
                });

                $("#btnSalesOrderSubmit", currentDiv).Button({ onClick: function () { Submit(); }, onHover: function () { checkError(); } });

                $("#btnSalesOrderDelete", currentDiv).click(function () { DeleteOrder(); });

                $("#drpProduct", currentDiv).DropdownBox({
                    data: localData.FlatProduct,
                    width: 400,
                    search: true,
                    textFeilds: ["product_number", "product_name_chinese"],
                    textLinkChar: " ",
                    valueFeild: "combination_id",
                    onChange: function (data) {
                        if (data.combination_id == undefined) return false;
                        $("#drpCompany .DropdownHead", currentDiv).removeClass("err");
                        if (_current_company == null) {
                            $("#drpCompany .DropdownHead", currentDiv).addClass("err");
                            $("#drpProduct", currentDiv).DropdownBoxReset();
                            return false;
                        }
                        
                        var unit_price = 0;
                        if (data.PF != 999) {
                            $.each(data.price, function (i, _price) {
                                if (_price.typeid == _current_company.sales_price_type_id) unit_price = _price.price;
                            });
                        }
                        var _info = {
                            product_id: data.product_id,
                            combination_id: data.combination_id,
                            sku: data.product_number,
                            customer_part_number: '',
                            description: data.product_name_chinese,
                            attributes_values: (data.PF != 999 ? data.attributes_values : ""),
                            qty: '',
                            unit_price: unit_price,
                            delete_ind: false,
                            PF: data.PF
                        };
                        var _has = false;
                        $("#OrderDetailTB").each(function () {
                            if ($(this).attr("PF") != 999) {
                                if ($(this).attr("combination_id") == data.combination_id) _has = true;
                            } else {
                                if ($(this).attr("product_id") == data.product_id) _has = true;
                            }
                        });
                        var _delete = 0;
                        $.each(currentObj.batchs, function (i, batch) {
                            $.each(batch.batchs, function (j, n) {
                                if (n.PF != 999) {
                                    if (n.combination_id == _info.combination_id) {
                                        _has = true;
                                        if (n.delete_ind) _delete = true;
                                    }
                                } else {
                                    if (n.product_id == _info.product_id) {
                                        _has = true;
                                        if (n.delete_ind) _delete = true;
                                    }
                                }
                                
                            });
                        });

                        if (!_has || _info.delete_ind) {
                            $.each(currentObj.batchs, function (i, batch) {
                                $.each(batch.batchs, function (j, n) {
                                    if (n.PF != 999) {
                                        if (n.combination_id == _info.combination_id) n.delete_ind = false;
                                    } else {
                                        if (n.product_id == _info.product_id) n.delete_ind = false;
                                    }
                                });
                            });
                            var _html = [];
                            _html.push('<tr rel="dataitem" align="center" product_id="' + _info.product_id + '" combination_id="' + _info.combination_id + '" PF="' + _info.PF + '">');
                            _html.push('<td>' + _info.sku + '</td>');
                            _html.push('<td align="left"><input type="text" class="txtinput" size="15" rel="customer_part_number" value="' + _info.customer_part_number + '"></td>');
                            _html.push('<td align="left">' + _info.description + '</td>');
                            _html.push('<td><span id="drpQtyType" class="mr5"></span><input type="text" class="txtinput tcenter" size="5" format="number" rel="Qty" old_qty="0" value="' + _info.qty + '">卷<p id="qtymsg" class="undis mt5 alarm"></p></td>');
                            _html.push('<td><span rel="unit_price" format="amount" unit_price="' + _info.unit_price + '"></span>' + (data.PF != 999 ? _info.unit_price : '<input type="text" class="txtinput" size="6" value="' + _info.unit_price + '" id="unit_price"><a class="icon-bar-chart icon-large ml" title="查看历史价格" report="TDS_Company_Product_Price" product_id="' + _info.product_id + '" company_code="' + (orderinfo == null ? _current_company.company_code : orderinfo.buyer_info.company_code) + '" guid_company="' + (orderinfo == null ? _current_company.guid_company : orderinfo.buyer_info.guid_company) + '"></a>') + '</td>');
                            _html.push('<td><span rel="amount" format="amount" amount="0">' + (_info.qty * _info.unit_price) + '</span></td>');
                            _html.push('<td><a class="icon-trash" title="Remove this item" id="btnRemoveItem"></a></td>');
                            _html.push('</tr>');

                            $("tr[rel='newitem']", currentDiv).before(_html.join(''));
                            var _tr = (_info.PF == 1 ? $("#OrderDetailTB tr[combination_id='" + _info.combination_id + "']", currentDiv) : $("#OrderDetailTB tr[product_id='" + _info.product_id + "']", currentDiv));
                            $(_tr).data("info", _info);

                            $("#drpQtyType", _tr).DropdownBox({
                                data: planqtytype,
                                width:35,
                                textFeilds: ["name"],
                                valueFeild: "id",
                                value: 1,
                                onChange: function (data) {
                                    processBatch(_tr);
                                }
                            });
                        }
                        $("#drpProduct", currentDiv).DropdownBoxReset();
                        $('[format="amount"]').formatCurrency();
                        initEvent();
                        checkSubmit();
                    }
                });
                initEvent();
            }

            function initEvent() {
                $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                    var _tr = this;
                    $("input[rel='Qty']", _tr).numeral({
                        onBlur: function (obj) {
                            $("span[rel='amount']", _tr).text($(obj).val() * $("span[rel='unit_price']", _tr).attr("unit_price"));
                            $("span[rel='amount']", _tr).attr("amount", $(obj).val() * $("span[rel='unit_price']", _tr).attr("unit_price"));

                            var _info = $(_tr).data("info");
                            if ($(obj).val() != _info.qty) {
                                _info.qty = $(obj).val();
                                $(_tr).data("info", _info);
                                processBatch(_tr);
                            }
                            checkSubmit();
                            SubTotal();
                            $('[format="amount"]').formatCurrency();
                        }
                    });
                    $("#unit_price", _tr).numeral({
                        point: true,
                        onBlur: function (obj) {
                            //$("span[rel='unit_price']", _tr).attr("unit_price", $(obj).val());
                            $("span[rel='amount']", _tr).text($(obj).val() * $("input[rel='Qty']", _tr).val());
                            $("span[rel='amount']", _tr).attr("amount", $(obj).val() * $("input[rel='Qty']", _tr).val());
                            var _info = $(_tr).data("info");
                            $.each(details, function (i, detail) {
                                if (detail.product_id == _info.product_id && detail.combination_id == _info.combination_id && detail.PF == _info.PF) {
                                    detail.unit_price = $(obj).val();
                                }
                            });
                            _info.unit_price = $(obj).val();
                            $(_tr).data("info", _info);
                            SubTotal();

                            $('[format="amount"]').formatCurrency();
                            checkSubmit();
                        }
                    });
                    $("input[rel='customer_part_number']", _tr).change(function () {
                        var _info = $(_tr).data("info");
                        _info.customer_part_number = $(this).val();
                        $(_tr).data("info", _info);
                        $.each(currentObj.batchs, function (i, batch) {
                            $.each(batch.batchs, function (j, n) {
                                if (n.product_id == _info.product_id && n.combination_id == _info.combination_id && n.PF == _info.PF) {
                                    n.customer_part_number = _info.customer_part_number;
                                }
                            });
                        });
                        checkSubmit();
                    });
                });
            }
            //处理批次数据
            function processBatch(obj) {
                $("#qtymsg", currentDiv).hide();
                //计算批次数及每批次的预计交货期和数量
                if ($("#OrderDetailTB tr[rel='dataitem']", currentDiv).length > 0) {
                    //生成批次数组
                    var batchnum = Math.ceil(currentObj.current_plan_type.value / currentObj.current_batch_type.value);
                    var new_arr_ind = batchnum != currentObj.batchs.length ? true : false;
                    if (new_arr_ind) {
                        currentObj.batchs = [];
                        for (var i = 1 ; i <= batchnum; i++) {
                            var request_date = Util.DateAdd("m", currentObj.current_batch_type.value * i, new Date());
                            var _info = {
                                batch: i,
                                batch_id: 0,
                                salesorder_id:0,
                                batchs: [],
                                request_date: request_date
                            };
                            currentObj.batchs.push(_info);
                        }
                    }
                    if (obj == undefined) {
                        $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                            var _tr = this;
                            var info = jQuery.extend(true, {}, $(_tr).data("info"));
                            var current_qty_type = $("#drpQtyType", _tr).getDropdownSelect();
                            var qty = $("input[rel='Qty']", _tr).val();
                            if (current_qty_type.id == 2) {
                                qty = qty * currentObj.current_plan_type.value;
                            }
                            var batch_qty = Math.floor(qty / currentObj.batchs.length);
                            $.each(currentObj.batchs, function (i, batch) {
                                var _info = jQuery.extend(true, {}, info);
                                if (!_info.delete_ind) _info.batch_qty;
                                batch.batchs.push(_info);
                            });
                            //当批次剩余量分配至最后一批次
                            var _balance = qty - (batch_qty * currentObj.batchs.length);
                            UpdateLastBatchQty(_balance, info.product_id, info.combination_id, info.PF);
                        });
                    } else {
                        var _tr = obj;
                        var info = jQuery.extend(true, {}, $(_tr).data("info"));
                        var current_qty_type = $("#drpQtyType", _tr).getDropdownSelect();
                        var qty = $("input[rel='Qty']", _tr).val();
                        if (current_qty_type.id == 2) {
                            qty = qty * currentObj.current_plan_type.value;
                        }

                        var _batchnum = 0;
                        $.each(currentObj.batchs, function (i, batch) {
                            $.each(batch.batchs, function (j, n) {
                                if (n.product_id == info.product_id && n.combination_id == info.combination_id && n.PF == info.PF) {
                                    if (!n.delete_ind) _batchnum++;
                                }
                            });
                        });
                        _batchnum = (_batchnum == 0 ? batchnum : _batchnum);
                        var batch_qty = Math.floor(qty / _batchnum);
                        info.batch_qty = batch_qty;

                        $.each(currentObj.batchs, function (i, batch) {
                            var _info = jQuery.extend(true, {}, info);
                            var has_ind = false;
                            $.each(batch.batchs, function (j, n) {
                                if (n.product_id == _info.product_id && n.combination_id == _info.combination_id && n.PF == _info.PF) {
                                    has_ind = true;
                                    n.qty = qty;
                                    if (n.delete_ind) {
                                        n.batch_qty = 0;
                                    } else {
                                        n.batch_qty = batch_qty;
                                    }
                                }
                            });
                            if (!has_ind) batch.batchs.push(_info);
                        });
                        //当批次剩余量分配至最后一批次
                        var _balance = qty - (batch_qty * _batchnum);
                        UpdateLastBatchQty(_balance, info.product_id, info.combination_id, info.PF);
                    }
                } else {
                    currentObj.batchs = [];
                }
                ProcessBatchHtml();
            }
            //当批次剩余量分配至最后一批次
            function UpdateLastBatchQty(balance,product_id, combination_id,PF) {
                if (balance > 0) {
                    for (var i = currentObj.batchs.length - 1; i >= 0; i--) {
                        var _temp = currentObj.batchs[i].batchs;
                        $.each(_temp, function (j, n) {
                            if (n.product_id== product_id &&  n.combination_id == combination_id && n.PF==PF) {
                                if (!n.delete_ind) {
                                    n.batch_qty = n.batch_qty * 1 + balance * 1;
                                    balance = 0;
                                }
                            }
                        });
                    }
                }
            }
            //处理批次列表
            function ProcessBatchHtml() {
                var html = [];
                $("#batchTB tr[data='batchitem']", currentDiv).remove();
                $.each(currentObj.batchs, function (i, batch) {
                    $.each(batch.batchs, function (j, n) {
                        html.push('<tr align="center" data="batchitem" combination_id="' + n.combination_id + '" batch="' + batch.batch + '" delete_ind="' + n.delete_ind + '">');
                        html.push('<td>' + batch.batch + '</td>');
                        html.push('<td>' + (batch.salesorder_id == 0 ? '<input type="text" class="txtinput tcenter" size="10" rel="Request_Date" batch="' + batch.batch + '" format="date" value="' + batch.request_date + '">' : batch.request_date) + '</td>');
                        html.push('<td>' + n.sku + '</td><td align="left">' + n.description + '</td>');
                        html.push('<td>' + (batch.salesorder_id == 0 ? '<input type="text" class="txtinput tcenter" size="5" format="number" rel="batch_qty" value="' + parseInt(n.batch_qty) + '">' : parseInt(n.batch_qty)) + '</td>');
                        html.push('<td>' + (batch.salesorder_id == 0 ? '<a class="icon-trash" title="Remove this item" rel="delBatch"></a>' : '<i class="icon-trash color969696"></i>') + '<a class="undo undis"><i class="icon-undo" title="Recovery this item" rel="delRecovery"></i></a></td>');
                        html.push('</tr>');
                    });
                });
                $("#batchTB tr:first", currentDiv).after(html.join(''));
                $("#batchTB", currentDiv).rowSpan(0);
                $("#batchTB", currentDiv).rowSpan(1);

                $("#batchTB tr[data='batchitem']", currentDiv).each(function () {
                    var _tr = this;
                   
                    if ($(_tr).attr("delete_ind") == "true") {
                        $("td:eq(2)", _tr).addClass("bgf1ff1 color969696 throughline");
                        $("td:eq(3)", _tr).addClass("bgf1ff1 color969696 throughline");
                        $("td:eq(4)", _tr).addClass("bgf1ff1 color969696 throughline");
                        $("input[rel='batch_qty']", _tr).val('0');
                        $("input[rel='batch_qty']", _tr).hide();
                        $("a.icon-trash", _tr).hide();
                        $("a.undo", _tr).show();
                    }
                    var _batch = $(_tr).attr("batch");
                    if (GetBatchDetailAvailable(_batch) == 1) {
                        $("#batchTB tr[batch='" + _batch + "'] a.icon-trash", currentDiv).removeAttr("title");
                        $("#batchTB tr[batch='" + _batch + "'] a.icon-trash", currentDiv).removeAttr("rel");
                        $("#batchTB tr[batch='" + _batch + "'] a.icon-trash", currentDiv).addClass("color969696");
                    }
                });

                initBatchEvent();
                function initBatchEvent() {
                    $("#batchTB tr[data='batchitem']", currentDiv).each(function () {
                        var _tr = this;
                        $("input[rel='batch_qty']", _tr).numeral({
                            onBlur: function (obj) {
                                UpdateBatchDetail(_tr);
                                CheckBatchQty($(_tr).attr("combination_id"));
                                checkSubmit();
                            }
                        });
                        $("input[rel='Request_Date']", _tr).change(function () {
                            //UpdateBatchDetail(_tr);
                            //更新批次的时间
                            $.each(currentObj.batchs, function (i, batch) {
                                $.each(batch.batchs, function (j, n) {
                                    if (batch.batch == $(_tr).attr("batch")) {
                                        batch.request_date = $("input[rel='Request_Date']", _tr).val();
                                    }
                                });
                            });
                            checkSubmit();
                        });
                    });
                    $("[format='date']").datetimepicker({
                        weekStart: 1,
                        todayBtn: 0,
                        autoclose: 1,
                        todayHighlight: 1,
                        startView: 2,
                        minView: 2,
                        format: "mm/dd/yyyy",
                        startDate: jsToday
                    });
                }
            }
            //更新某批次明细信息（批次产品的数量）
            function UpdateBatchDetail(tr,delete_ind) {
                $.each(currentObj.batchs, function (i, batch) {
                    $.each(batch.batchs, function (j, n) {
                        if (batch.batch == $(tr).attr("batch")) {
                            if (n.combination_id == $(tr).attr("combination_id")) {
                                n.batch_qty = $("input[rel='batch_qty']", tr).val();
                                n.delete_ind = delete_ind == undefined ? false : delete_ind;
                            }
                            //batch.request_date = $("input[rel='Request_Date']", tr).val();
                        }
                    });
                });
            }
            //删除批次某产品所有明细
            function DeleteBatchDetail(tr) {
                $.each(currentObj.batchs, function (i, batch) {
                    var _has = false;
                    $.each(batch.batchs, function (j, n) {
                        if (n.combination_id == $(tr).attr("combination_id")) {
                            _has = true;
                        }
                        if (_has) {
                            if (batch.batch_id == 0) {
                                batch.batchs.splice(j, 1);
                                return false;
                            } else {
                                n.delete_ind = true;
                                return false;
                            }
                        }
                    });
                });
            }
            //获取某批次的产品明细记录数
            function GetBatchDetailAvailable(batchno) {
                var _count = 0;
                $.each(currentObj.batchs, function (i, batch) {
                    if (batch.batch== batchno) {
                        $.each(batch.batchs, function (j, n) {
                            if (!n.delete_ind) {
                                _count++;
                            }
                        });
                    }
                });
                return _count;
            }
            //检查批次发货数量与订单数量是否符合
            function CheckBatchQty(combination_id) {
                var _check = true;
                var qty = 0;
                var batchqty = 0;
                $.each(currentObj.batchs, function (i, batch) {
                    $.each(batch.batchs, function (j, n) {
                        if (n.combination_id == combination_id) {
                            qty = n.qty;
                            batchqty += n.batch_qty * 1;
                        }
                    });
                });
                var _tr = $("#OrderDetailTB tr[combination_id='" + combination_id + "']", currentDiv);
                $("#qtymsg", _tr).hide();
                if (batchqty != qty) {
                    $("#qtymsg", _tr).show();
                    $("#qtymsg", _tr).html('批次总量与订购数量不符！<br>' + batchqty + "-" + qty + "=" + (batchqty - qty));
                    _check = false;
                }
                return _check;
            }

            function SubTotal() {
                var _total_amount = 0;
                var _total_qty = 0;
                $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                    var thisPF = $(this).attr("PF");
                    var amount = $("span[rel='amount']", this).attr("amount");
                    _total_amount += (amount * 1);
                    _total_qty += ($("input[rel='Qty']", this).val() * 1);
                });
                $("span[rel='total']", currentDiv).text(_total_amount);
                $("span[rel='totalQty']", currentDiv).text(_total_qty);
            }

            function checkSubmit() {
                var _Check = true;
                if (orderinfo == null) {
                    if ($("#drpCompany", currentDiv).getDropdownSelect() == null) {
                        _Check = false;
                    } else {
                        $("#drpCompany .DropdownHead", currentDiv).removeClass("err");
                    }
                }
                if ($("#OrderDetailTB tr[rel='dataitem']", currentDiv).length == 0) {
                    _Check = false;
                } else {
                    $("#drpProduct .DropdownHead", currentDiv).removeClass("err");
                }
                if ($("#ConfirmContractTerms:checked", currentDiv).length == 0) {
                    _Check = false;
                } else {
                    $("#ConfirmContractTermsBox", currentDiv).removeClass("err");
                }
                $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                    if ($("input[rel='Qty']", this).val() == "") {
                        _Check = false;
                    } else {
                        $("input[rel='Qty']", this).removeClass("err");
                    }
                    if (!CheckBatchQty($(this).attr("combination_id"))) {
                        _Check = false;
                    }
                });

                $("#batchTB tr[data='batchitem']", currentDiv).each(function () {
                    if ($("input[rel='batch_qty']", this).val() == "") {
                        _Check = false;
                    } else {
                        $("input[rel='batch_qty']", this).removeClass("err");
                    }
                    if ($("input[rel='Request_Date']", this).val() == "") {
                        _Check = false;
                    } else {
                        $("input[rel='Request_Date']", this).removeClass("err");
                    }
                });

                $("#btnSalesOrderSubmit", currentDiv).changeStatus(_Check);
            }

            function checkError() {
                $(".err").removeClass("err");
                if ($("#drpCompany", currentDiv).getDropdownSelect() == null) $("#drpCompany .DropdownHead", currentDiv).addClass("err");
                if ($("#OrderDetailTB tr[rel='dataitem']", currentDiv).length == 0) $("#drpProduct .DropdownHead", currentDiv).addClass("err");
                if ($("#ConfirmContractTerms:checked", currentDiv).length == 0) $("#ConfirmContractTermsBox", currentDiv).addClass("err");
                $("#OrderDetailTB tr[rel='dataitem']", currentDiv).each(function () {
                    if ($("input[rel='Qty']", this).val() == "") $("input[rel='Qty']", this).addClass("err");
                    CheckBatchQty($(this).attr("combination_id"))
                });
                $("#batchTB tr[data='batchitem']", currentDiv).each(function () {
                    if ($("input[rel='batch_qty']", this).val() == "") $("input[rel='batch_qty']", this).addClass("err");
                    if ($("input[rel='Request_Date']", this).val() == "") $("input[rel='Request_Date']", this).addClass("err");
                });
            }
            
            function Submit() {
                //$("#HtmlBox").mask("正在提交数据...");
                if (orderinfo == null) {
                    orderinfo = {
                        "order_id":0,
                        "buyer_company_id": _current_company.company_id,
                        "buyer_company_code": _current_company.company_code,
                        "buyer_company": _current_company,
                        "buyer_purchase_number": $("#buyer_purchase_number", currentDiv).val(),
                        "payment_term_id": _current_company.payment_term_id,
                        "payment_term": _current_company.payment_term,
                        "tax_ind": $("#Chk_Sales_Tax:checked", currentDiv).length == 0 ? false : true,
                        "term_note": $("#OrderContent", currentDiv).val().replace("{payment}", _current_company.payment_term),
                        "order_term": currentObj.current_plan_type,
                        "batch_type": currentObj.current_batch_type,
                        "bank": BankData[0]
                    };
                } else {
                    orderinfo.buyer_purchase_number = $("#buyer_purchase_number", currentDiv).val();
                    orderinfo.term_note = $("#OrderContent", currentDiv).val().replace("{payment}", _current_company.payment_term);
                    orderinfo.tax_ind = $("#Chk_Sales_Tax:checked", currentDiv).length == 0 ? false : true;
                    orderinfo.order_term = currentObj.current_plan_type;
                    orderinfo.batch_type = currentObj.current_batch_type;
                }

                $.each(currentObj.batchs, function (i, batch) {
                    $.each(batch.batchs, function (j, n) {
                        n.batch_qty = n.batch_qty.toString();
                        $.each(details, function (i, detail) {
                            if (detail.product_id == n.product_id && detail.combination_id == n.combination_id && detail.PF == n.PF) {
                                n.unit_price = detail.unit_price;
                            }
                        });
                    });
                });
                var query = new Object();
                query.orderinfo = JSON.stringify(orderinfo);
                query.batchs = JSON.stringify(currentObj.batchs);
                $.ajax({
                    type: "POST",
                    contentType: "application/json",
                    url: setting.WebService + "SalesOrder.asmx/SaveClientPOSales",
                    datatype: 'json',
                    data: JSON.stringify(query),
                    success: function (result) {
                        var response = eval('(' + result.d + ')');
                        $("#HtmlBox").unmask();
                        if (response.flag) {
                            location.hash = "!ProcessSales?mode=cpsales&cpid=" + response.id + "&num=" + response.number;
                        } else {
                            jAlert(response.message);
                        }
                    }
                });
            }

            function DeleteOrder() {
                jConfirm('是否确定删除<span class="red">' + orderinfo.order_number + '</span>年订单？<span class="red">删除后将无法恢复！</span>', "删除年订单确认", function (r) {
                    if (r) {
                        $("#HtmlBox").mask("正在提交数据...");
                        var query = new Object();
                        query.order_id = _plan_sales_id;
                        $.ajax({
                            type: "POST",
                            contentType: "application/json",
                            url: setting.WebService + "SalesOrder.asmx/DeleteClientPOSales",
                            datatype: 'json',
                            data: JSON.stringify(query),
                            success: function (result) {
                                var response = eval('(' + result.d + ')');
                                $("#HtmlBox").unmask();
                                if (response.flag) {
                                    location.hash = "!ProcessSales";
                                } else {
                                    jAlert(response.message);
                                }
                            }
                        });
                    }
                });
            }
        }

        Sales._initialized = true;
    }
}

var Sales = new Sales();

var tempContent = '三、付款方式及期限：{payment}。<BR>四、违约责任、解决合同纠纷的方式按《中华人民共和国合同法》和有关规定执行。<BR>五、本合同一式二份，供方一份，需方一份，双方代表签字或盖章即可生效。与本合同有关的传真件、电子邮件为本合同的有效组成部分。';