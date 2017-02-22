/**
 * Created by user on 2015/12/14.
 */

saicfc.nameSpace.reg("sys.area");

(function(){
    sys.area.areaMain = function(){
        var ctxData = saicfc.utils.getServerPath("system");

        /**
         * 申明内部对象
         * @type {saicfc.pmpf}
         */
        var obj = this;

        this.areaTable = {};
        this.areaTree = {};
        this.curSelTree={};

        /**
         * 初始化调用 function
         */
        this.init = function() {
            /**
             * 查询
             */
            $(".btn-search").click(function(){
                obj.areaTable.ajax.reload();
            });
            $(document).bind("keydown",".filter input",function(e){
                var theEvent = window.event || e;
                var code = theEvent.keyCode || theEvent.which;
                if (code == 13) {
                    obj.areaTable.ajax.reload();
                }
            });

            /**
             * 重置
             */
            $("#btn-reset").click(function(){
                saicfc.utils.cleanValue(".filter");
            });

            /**
             * 新增
             */
            $("#btn-plus").on("click",obj.plusFun);

            /**
             * 修改
             */
            $("#btn-edit").on("click",obj.editFun);

            /**
             * 删除
             */
            $("#btn-remove").on("click",obj.removeFun);

            obj.loadAreaTreeFun();
            obj.loadAreaTableFun();

        };


        /**
         * 新增 function
         */
        this.plusFun = function(){
           if(obj.curSelTree.id == undefined ){
                saicfc.win.alert("请选择要添加的节点");
                return;
            }
            saicfc.win.show("区域新增","system/area/areaManage.html?parentId=" + obj.curSelTree.id,700,400,false);
        }

        /**
         * 修改 function
         */
        this.editFun = function(){
            var selRows = obj.areaTable.rows(".info").data();
            if(selRows.length < 1){
                saicfc.win.alert("请选择修改的数据");
                return;
            }
            saicfc.win.show("区域修改","system/area/areaManage.html?areaId=" + selRows[0].areaId,700,400,false);
        }

        /**
         * 删除 function
         */
        this.removeFun = function(){
            var selRows = obj.areaTable.rows(".info").data();
            if(selRows.length < 1){
                saicfc.win.alert("请选择修改的数据");
                return;
            }
            saicfc.win.confirm("确认删除吗？",function(btn){
                if(btn == "yes"){
                    $.ajax({
                        url: ctxData + "/sys/area/delete?date=" + new Date().getTime(),
                        data: {areaId : selRows[0].areaId },
                        success: function(retData){
                            saicfc.win.alert(retData.msg,retData.status);
                            if(retData.status == "0"){
                               obj.loadAreaTreeFun();
                            }
                        }
                    });
                }
            });
        }

        /**
         * 加载数据表 function
         */
        this.loadAreaTableFun = function(){
            var record_table = $("#area-table").DataTable({
                "bAutoWidth" : false,
                "bFilter" : false,// 搜索栏
                "bSort" : false,
                "bInfo" : false,// Showing 1 to 10 of 23 entries 总记录数没也显示多少等信息
                "bServerSide" : true,
                "paging":   false,
                "sAjaxSource": ctxData + '/sys/area/query',
                "fnServerData": function (sUrl, aoData, fnCallback) {
                    $.ajax({
                        url: sUrl,
                        data: aoData,
                        success: function(data){
                            fnCallback(data);
                            //渲染结束重新设置高度
                            parent.saicfc.common.setIframeHeight($.getUrlParam(saicfc.iframeId));
                        }
                    });
                },
                "fnServerParams": function (aoData) {
                    var parentId = 0;
                    if(obj.curSelTree.id != undefined ){
                        parentId = obj.curSelTree.id;
                    }
                    aoData.push(
                        { "name": "areaName", "value": $("#areaName").val() },
                        { "name": "parentId", "value": parentId }
                    );
                },
                "aoColumnDefs": [
                    {
                        sDefaultContent: '',
                        aTargets: [ '_all' ]
                    }
                ],
                "aoColumns": [{
                    data : "areaName",
                    sWidth : "2",
                    render : function(value){
                        return '<label class="pos-rel"><input id="' + value + '" type="checkbox" class="ace" /><span class="lbl"></span></label>';
                    }
                },{
                    data: "areaName",
                    sWidth : "100",
                    sClass : "text-center",
                    sSort : false
                },{
                    data: "areaCode",
                    sWidth : "200",
                    sClass : "text-left"
                },{
                    data: "sort",
                    sWidth : "60",
                    sClass : "text-center"
                },{
                    data: "createTime",
                    sWidth : "80",
                    sClass : "text-center",
                    render : function(value){
                        return saicfc.moment.formatYMD(value);
                    }
                },{
                    data: "areaId",
                    sWidth : "80",
                    sClass : "text-center",
                    render : function(){
                        return "<div class='bolder'> <a class='red' href='javaScript:areaMain.editFun()'><i class='ace-icon fa fa-edit'></i></a> | " +
                            "<a class='red' href='javaScript:areaMain.removeFun()'><i class='ace-icon fa fa-remove'></i></a></div> ";
                    }
                }]
            });

            obj.areaTable = record_table;

            //单选事件
            $("#area-table tbody").on("click","tr",function() {
                $.each($("#area-table tbody").find("input[type='checkbox']"),function(index,object){
                    object.checked = false;
                });
                $(this).find("input[type='checkbox']").get(0).checked = true;
                $("#area-table>tbody>tr").removeClass("info");
                $(this).addClass("info");
            });

            $("#area-table tbody").on("dblclick","tr",function() {
                obj.editFun();
            });
        }

        /*** 加载 tree **/
        this.loadAreaTreeFun = function () {
            $.ajax({
                url: ctxData + "/sys/area/querytree?date="+new Date().getTime(),
                success: function(retData){
                    if(retData.status == 0){
                        $.fn.zTree.init($("#areaTree"),{
                            check: {
                                enable: false,
                            },
                            data: {
                                simpleData: {
                                    enable: true
                                }
                            },
                            callback: {
                                onClick: function onClick(e, treeId, treeNode) {
                                    obj.areaTree.selectNode(treeNode);
                                    obj.curSelTree = treeNode;
                                    obj.areaTable.ajax.reload();
                                    e.preventDefault();
                                    return false;
                                }
                            }
                        }, retData.data);

                        obj.areaTree = $.fn.zTree.getZTreeObj("areaTree");

                        if(obj.curSelTree.id != undefined ){
                            obj.areaTree.selectNode(obj.curSelTree);
                        }else{
                            var nodes = obj.areaTree.getNodes();
                            if (nodes.length>0) {
                                obj.areaTree.selectNode(nodes[0]);
                                obj.curSelTree = nodes[0];
                            }
                        }

                        obj.areaTree.expandAll(true);

                        obj.areaTable.ajax.reload();
                    }
                    //渲染结束重新设置高度
                    parent.saicfc.common.setIframeHeight($.getUrlParam(saicfc.iframeId));
                }
            });
        }


        /**
         *
         * 新增编辑回调函数
         *
         */
        this.editCallBackFun = function(params){
            //加载数据
            obj.loadAreaTreeFun();
            if(params.areaId== undefined || params.areaId =="" ){
                return;
            }
            //选中之前选中的数据

        }


    };

    /**
     * 初始化数据
     */
    $(document).ready(function() {
        areaMain.init();
    });
})();
var areaMain = new sys.area.areaMain();





