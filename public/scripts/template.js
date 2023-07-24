/*jshint unused:false,evil:true*/

var templateReady = document.createEvent('CustomEvent');
templateReady.initEvent('tmplready', true, false);

window.template = (function ()
{
    let context            = {};
    context.interactive    = false;
    context.showEventsIcon = true;

    window.addEventListener('unload', function (e)
    {
        //console.log('window.unload');
        if (context.onDestruct)
            context.onDestruct();
    });

    API.USER.refresh(webix.bind(function ()
    {
        let demoView = new API.DEMO.demoView();  
            
        let newEventSubscribers     = [];
        let ackEventSubscribers     = [];
        let ackAllEventsSubscribers = [];

        let canViewEvents        = API.USER.hasPermission("events.view");
        let canViewAlarms        = API.USER.hasPermission("alarms.view");
        let canViewNotifications = API.USER.hasPermission("notifications.view");

        let setMainConnectionState = function (state)
        {
            let con = $$('connect_main');
            if (con && con.isVisible())
            {
                con.config.icon = state === true ? "state_started" : "state_failure";
                con.refresh();
            }
            setReservConnectionState(state);
        };
        let setReservConnectionState = function (state)
        {
            let con = $$('connect_reserv');
            if (con && con.isVisible())
            {
                con.config.icon = state === true ? "state_started" : "state_failure";
                con.refresh();
            }
        };

        let executePing = function ()
        {
            if (!isFrame())
            {
                var pingRoutine = function ()
                {
                    AJAX.get(API.FUNC.ping, null,
                        function (xhr, rsp)
                        {
                            setMainConnectionState(true);
                            setTimeout(pingRoutine, 5000);
                        },
                        function (xhr, err)
                        {
                            setMainConnectionState(false);
                            messageError(translate("common.errors.server_connection"));
                            if (context.onServerPingFailed)
                                context.onServerPingFailed();
                            setTimeout(pingRoutine, 5000);
                        }
                    );
                };
                // pingRoutine();
            }
        };
        let buildComplete = function (result)
        {
            if (isDefined(result))
                webix.ui(result, $$("pageview"), $$("content"));
            context.buildTemplateComplete();
        };
        let buildMainMenu = function (complete)
        {
            var sideMenu = [];
            sideMenu.push({ id: "home", value: translate('template.pages.main'), icon: "fas fa-laptop", href: "home" });
            //---->fix<------//
            // webix.ajax(API.FUNC.queryMenu).then(function (res)
            // {

                // let items = res.json();
                let items = [
                    {id: 'exchange', value: "translate('template.pages.polling')", icon: 'fas fa-exchange-alt', href: 'exchange'},
{id: 'equipments', value: "translate('template.pages.equipments')", icon: 'fas fa-cogs', href: 'equipments'},
{id: 'scheme/list', value: "translate('template.pages.schemes')", icon: 'fas fa-image', href: 'scheme/list'},
{id: 'db/edit', value: "translate('template.pages.db')", icon: 'fas fa-database', href: 'db/edit'},
{id: 'dba/main', value: "translate('template.pages.dba')", icon: 'fas fa-database', href: 'dba/main'},
{id: 'users', value: "translate('template.pages.users')", icon: 'fas fa-user', href: 'users'},
{id: 'events', value: "translate('template.pages.events')", icon: 'fas fa-envelope', href: 'events'},
{id: 'reports/list', value: "translate('template.pages.reports')", icon: 'fas fa-clipboard-list', href: 'reports/list'}
                ]
                //---->fix<------//
                if (items != null && items.length > 0)
                {
                    for (let i = 0; i < items.length; i++)
                    {
                        let value = items[i].value;
                        if (!isNullOrEmpty(value))
                        {
                            try
                            {
                                items[i].value = eval(value);
                            }
                            catch (e)
                            {
                                HELP.log(e);
                            }
                        }
                        sideMenu.push(items[i]);
                    }
                }
// @if !LINKMT
                sideMenu.push({
                    id: "exit", value: translate('common.exit'), icon: "fas fa-sign-out-alt", href: function ()
                    {
                        messageConfirm(translate('template.exit_confirm'), function (res)
                        {
                            if (res === true)
                                API.USER.logout();
                        });
                    }
                });
// @endif
                if (complete != null)
                    complete(sideMenu);
            // });
        };

        // update time event
        let updateTime = function (serverTime)
        {
            let ttmpl = $$('timer');
            if (ttmpl)
                ttmpl.setValues({ time: API.FORMAT.getRawTimestamp(serverTime, 0) });
        };
        // show exec notification result
        let notifyExecutionResult = function (item)
        {
            if (item == null || !item.success)
                messageError(translate("common.errors.command_execution"));
            else
                messageSuccess(translate("common.messages.command_execution_success"));
        };

        const handleProjectEvent = (event) => {
    
        };

        let popupWidth  = $(window).width() / 1.4;
        let popupHeight = $(window).height() / 1.2;

        let buildTemplateLayout = function (complete)
        {
            if (canViewEvents && context.showEventsIcon)
            {
                webix.require([
                    '/js/common/not_ack_events_view.js'
                ], function () {
                    let eventsUI = new notAckEventsView();
                    let eventsWnd = webix.ui({
                        view: "window",
                        id: "wndNotAckEvents",
                        modal: true,
                        width: popupWidth,
                        height: popupHeight,
                        move: true,
                        //fullscreen: true,
                        position: "center",
                        close: true,
                        resize: true,
                        head: translate("template.pages.events"),
                        body:
                        {
                            rows:
                                [
                                    eventsUI.build(),
                                    {
                                        view: "button", width: 0, height: 1, css: "hidden", hotkey: "esc",
                                        click: function () {
                                            eventsWnd.hide();
                                        }
                                    }
                                ]
                        },
                        on:
                        {
                            onBeforeShow: function () {
                                eventsUI.update();
                            }
                        }
                    });
                });
            }

            let alarmsWnd = webix.ui({
                view: "window",
                id: "wndAlarms",
                modal: true,
                width: popupWidth,
                height: popupHeight,
                move: true,
                position: "center",
                close: true,
                resize: true,
                head: translate("template.alarms.title"),
                body:
                {
                    css: "alarms-view",
                    rows:
                        [
                            {
                                id: "tblAlarms",
                                view: "datatable",
                                resizeColumn: { size: 8 },
                                resizeRow: false,
                                editable: false,
                                headerRowHeight: 30,
                                navigation: true,
                                css: "alarms-table",
                                select: "row",
                                rowHeight: 24,
                                scrollX: "auto",
                                drag: false,
                                dragColumn: "order",
                                tooltip: false,
                                update: function (alarms)
                                {
                                    let grid = $$('tblAlarms');
                                    if (alarms == null)
                                    {
                                        grid.clearAll();
                                        grid.loadNext(0, 0, null, grid.config.url, true);
                                    }
                                    else
                                    {
                                        for (let i = 0; i < alarms.length; i++)
                                        {
                                            let alm = alarms[i];
                                            let exists = grid.exists(alm.id);
                                            if (alm.active && !exists)
                                                grid.add(alm);
                                            else if (!alm.active && exists)
                                                grid.remove(alm.id);
                                        }
                                    }
                                },
                                url: {
                                    $proxy: true,
                                    load: function (view, params)
                                    {
                                      
                                        //---->fix<------//
                                        // return webix.ajax().get(API.FUNC.alarmsList, params).then(function (data)
                                        // {
                                        //     return data.json();
                                        // });
                                        const mockArr = []
                                        return mockArr
                                        //---->fix<------//
                                    }
                                },
                                columns:
                                    [
                                        {
                                            id: "text", header: translate("common.name"), fillspace: 0.5, tooltip: false,
                                            template: function (obj, common, value, col, ind)
                                            {
                                                return "<b>" + value + "</b>";
                                            }
                                        },
                                        {
                                            id: "src", header: translate("common.source"), fillspace: 0.5,
                                            template: "<a href='#link#' target='_blank'>#src#</a>"
                                        },
                                        {
                                            id: "ts", header: { text: translate("common.timestamp"), css: "multiline" }, width: 210, tooltip: false,
                                            template: function (obj, common, value, config)
                                            {
                                                return API.FORMAT.getRawTimestamp(value);
                                            }
                                        }
                                    ],
                                data: [],
                                on:
                                {
                                    onBeforeLoad: function ()
                                    {
                                        this.showOverlay("Загрузка списка тревог...");
                                    },
                                    onAfterLoad: function ()
                                    {
                                        this.hideOverlay();
                                    }
                                }
                            },
                            {
                                cols:
                                    [
                                        {
                                            // space
                                        },
                                        {
                                            view: "icon", type: "button", icon: "wxi-sync", css: "webix_transparent", width: 50, tooltip: translate("common.refresh"), click: function ()
                                            {
                                                $$('tblAlarms').config.update();
                                            }
                                        }
                                    ]
                            },
                            {
                                view: "button", width: 0, height: 1, css: "hidden", hotkey: "esc",
                                click: function ()
                                {
                                    alarmsWnd.hide();
                                }
                            }
                        ]
                },
                on:
                {
                    onBeforeShow: function ()
                    {
                        $$('tblAlarms').config.update();
                    }
                }
            });
            let notificationsWnd = webix.ui({
                view: "window",
                id: "wndNotifications",
                modal: true,
                width: popupWidth,
                height: popupHeight,
                move: true,
                position: "center",
                close: true,
                resize: true,
                head: translate("template.notifications.title"),
                body:
                {
                    css: "notifications-view",
                    rows:
                        [
                            {
                                id: "tblNotifications",
                                view: "datatable",
                                resizeColumn: { size: 8 },
                                resizeRow: false,
                                editable: false,
                                headerRowHeight: 30,
                                navigation: true,
                                css: "notifications-table",
                                select: "row",
                                rowHeight: 24,
                                scrollX: "auto",
                                drag: false,
                                dragColumn: "order",
                                tooltip: false,
                                update: function (items)
                                {
                                    let grid = $$('tblNotifications');
                                    if (items == null)
                                    {
                                        grid.clearAll();
                                        grid.loadNext(0, 0, null, grid.config.url, true);
                                    }
                                    else
                                    {
                                        items.forEach(function (x)
                                        {
                                            if (x.removed)
                                                grid.remove(x.id);
                                            else
                                                grid.add(x, 0);
                                        });
                                    }
                                },
                                url: {
                                    $proxy: true,
                                    load: function (view, params)
                                    {
                                        //---->fix<------//
                                        // return webix.ajax().get(API.FUNC.notificationsList, params).then(function (data)
                                        // {
                                        //     return data.json();
                                        // });
                                        const mockArr = []
                                        return mockArr
                                        //---->fix<------//

                                    }
                                },
                                columns:
                                    [
                                        {
                                            id: "text", header: "Название", fillspace: 0.5, tooltip: false,
                                            template: function (obj, common, value, col, ind)
                                            {
                                                return "<b>" + value + "</b>";
                                            }
                                        },
                                        {
                                            id: "src", header: "Источник", fillspace: 0.5,
                                            template: API.USER.hasAnyPermission("equipments.edit, equipments.view") ? "<a href='#link#' target='_blank'>#src#</a>" : "#src#"
                                        },
                                        {
                                            id: "ts", header: { text: translate("common.timestamp"), css: "multiline" }, width: 210, tooltip: false,
                                            template: function (obj, common, value, config)
                                            {
                                                return API.FORMAT.getRawTimestamp(value);
                                            }
                                        },
                                        {
                                            id: "accept", header: "<span class='webix_icon wxi-check accept_list' title='Квитировать все уведомления'></span>",
                                            width: 35, tooltip: "Квитировать выбранное уведомление", hidden: !API.USER.hasPermission("notifications.ack"),
                                            template: function (obj, common)
                                            {
                                                return "<span class='webix_icon wxi-check accept'></span>";
                                            }
                                        }
                                    ],
                                data: [],
                                on:
                                {
                                    onBeforeLoad: function ()
                                    {
                                        this.showOverlay("Загрузка списка уведомлений...");
                                    },
                                    onAfterLoad: function ()
                                    {
                                        this.hideOverlay();
                                    }
                                },
                                onClick:
                                {
                                    "accept": function (evt, id, trg)
                                    {
                                        if (!isDefined(id))
                                            return;
                                        messageConfirm("Квитировать выбранное уведомление", function (result)
                                        {
                                            if (result === true)
                                                AJAX.post(API.FUNC.notificationsAccept, null, id.row);
                                        });
                                        return false;
                                    },
                                    "accept_list": function (evt, id, trg)
                                    {
                                        if (!isDefined(id))
                                            return;
                                        messageConfirm("Квитировать все уведомления", function (result)
                                        {
                                            if (result === true)
                                                webix.ajax().post(API.FUNC.notificationsAcceptAll);
                                        }); 
                                        return false;
                                    }
                                }
                            },
                            {
                                cols:
                                    [
                                        {
                                            // space
                                        },
                                        {
                                            view: "icon", type: "button", icon: "wxi-sync", css: "webix_transparent", width: 50, tooltip: translate("common.refresh"), click: function ()
                                            {
                                                $$('tblNotifications').config.update();
                                            }
                                        }
                                    ]
                            },
                            {
                                view: "button", width: 0, height: 1, css: "hidden", hotkey: "esc",
                                click: function ()
                                {
                                    notificationsWnd.hide();
                                }
                            }
                        ]
                },
                on:
                {
                    onBeforeShow: function ()
                    {
                        $$('tblNotifications').config.update();
                    }
                }
            });

            var timeTemplate = webix.template("<span class='fas fa-clock'></span>" + translate('template.server_time') + ": #time#");

            // side menu
            webix.ui({
                view: "sidemenu",
                id: "menu",
                width: 250,
                move: false,
                scroll: false,
                position: "left",
                state: function (state)
                {
                    var demoheaderHeight = $$("demoheader").$height || 0;
                    var toolbarHeight = $$("toolbar").$height;
                    var footerHeight = $$("footer").$height;
                    state.top = demoheaderHeight + toolbarHeight;
                    state.height -= (demoheaderHeight + toolbarHeight + footerHeight);
                },
                body:
                {
                    view: "list",
                    id: "menulist",
                    borderless: true,
                    navigation: true,
                    scroll: false,
                    select: true,
                    template: "<span class='#icon#'></span> #value#",
                    data: [],
                    type:
                    {
                        height: 34
                    },
                    ready: function () 
                    {
                        let menuReady = webix.bind(function (menu)
                        {
                            if (menu == null)
                                return;

                            this.define("data", menu);
                            this.refresh();

                            if (!isNullOrEmpty(location.pathname))
                            {
                                let path = location.pathname.trimString('/');
                                if (!isNullOrEmpty(path))
                                {
                                    if (this.exists(path))
                                        this.select(path);
                                }
                            }
                        }, this);
                        buildMainMenu(menuReady);
                    },
                    on:
                    {
                        onBeforeSelect: function (id, selection)
                        {
                            if (selection === true)
                            {
                                let item = this.getItem(id);
                                if (!isDefined(item))
                                    return false;
                                if (isDefined(item.href))
                                {
                                    if (typeof item.href === "string")
                                    {
                                        let evt = window.event;
                                        let targetUrl = HELP.buildUrl(item.href);
                                        if (location.href !== targetUrl)
                                        {
                                            if (isDefined(evt) && evt.ctrlKey)
                                                HELP.openUrl(targetUrl, true);
                                            else
                                                HELP.pageRedirect(item.href);
                                            return false;
                                        }
                                    }
                                    else if (typeof item.href === "function")
                                    {
                                        item.href.apply(this);
                                        return false;
                                    }
                                }
                            }
                            return true;
                        }
                    }
                },
                on:
                {
                    onHide: function ()
                    {
                        let toggleBtn = $$("btnMenu");
                        if (toggleBtn.getValue() === 1)
                            toggleBtn.toggle();
                    }
                }
            });

            // main layout
            var mainLayout = webix.ui({
                id: 'pageview',
                container: "layout",
                //responsive: true,
                borderless: true,
                rows:
                    [
                        
                        demoView.buildView(),
                        {
                            view: "toolbar",
                            id: "toolbar",
                            css: 'header',
                            height: 40,
                            elements:
                                [
                                    {
                                        view: "toggle", type: "icon", id: "btnMenu", label: translate('common.menu'), width: 100, value: 0,
                                        offIcon: "fas fa-bars", onIcon: "fas fa-angle-double-down",
                                        click: function ()
                                        {
                                            let sideMenu = $$("menu");
                                            if (sideMenu.config.hidden === true)
                                                sideMenu.show(true);
                                            else
                                                sideMenu.hide();
                                        }
                                    },
                                    {
                                        id: "placeholder_header"
                                    },
                                    // @if WEBSCADA
                                    {
                                        view: "icon", id: "not_ack_events", type: "button", icon: "fas fa-envelope", badge: null, width: 35,
                                        tooltip: translate("template.pages.events"), hidden: !context.showEventsIcon || !canViewEvents,
                                        click: function (id, evt)
                                        {
                                            // reset badge
                                            this.config.badge = null;
                                            this.refresh();

                                            if (isDefined(evt) && evt.ctrlKey)
                                                HELP.openUrl("/events", true);
                                            else
                                            {
                                                let eventsWnd = $$('wndNotAckEvents');
                                                if (eventsWnd)
                                                {
                                                    eventsWnd.show();
                                                    eventsWnd.adjust();
                                                }
                                            }
                                        }
                                    },
                                    {
                                        view: "icon", id: "alarms", type: "button", icon: "fas fa-exclamation-triangle", badge: null, width: 35,
                                        tooltip: translate("template.alarms.title"), hidden: !canViewAlarms,
                                        click: function (id, evt)
                                        {
                                            // reset badge
                                            this.config.badge = null;
                                            this.refresh();

                                            if (alarmsWnd != null)
                                            {
                                                alarmsWnd.show();
                                                alarmsWnd.adjust();
                                            }
                                        }
                                    },
                                    {
                                        view: "icon", id: "notifications", type: "button", icon: "fas fa-comment-alt", badge: null, width: 35,
                                        tooltip: translate("template.notifications.title"), hidden: !canViewNotifications,
                                        click: function (id, evt)
                                        {
                                            // reset badge
                                            this.config.badge = null;
                                            this.refresh();

                                            if (notificationsWnd != null)
                                            {
                                                notificationsWnd.show();
                                                notificationsWnd.adjust();
                                            }
                                        }
                                    },
                                    // @endif
                                    {
                                        css: "connections",
                                        cols:
                                            [
                                                {
                                                    view: "icon", id: "connect_main", css: "main", icon: "state_stopped", tooltip: translate("template.main_server_state"), width: 30, hidden: false
                                                },
                                                // @if WEBSCADA
                                                {
                                                    view: "icon", id: "connect_reserv", css: "reserv", icon: "state_stopped", tooltip: translate("template.reserv_server_state"), width: 30, hidden: true
                                                }
                                                // @endif
                                            ]
                                    },
                                    // @if WEBSCADA
                                    {
                                        view: "button", type: "icon", icon: "fas fa-sign-out-alt", label: translate('common.exit'), tooltip: translate('common.exit'), width: 100, hidden: false, click: function ()
                                        {
                                            messageConfirm(translate('template.exit_confirm'), function (res)
                                            {
                                                if (res === true)
                                                    API.USER.logout();
                                            });
                                        }
                                    }
                                    // @endif
                                ]
                        },
                        {
                            id: "content"
                        },
                        {
                            id: 'footer',
                            css: 'footer',
                            cols:
                                [
                                    {
                                        view: "template",
                                        borderless: true,
                                        autoheight: true,
                                        tooltip: translate('template.current_user'),
                                        css: 'user_template',
                                        template: "<span class='fas fa-user'></span> #user#",
                                        on:
                                        {
                                            onBeforeRender: webix.once(function ()
                                            {
                                                if (API.USER.current != null)
                                                {
                                                    let userName = (API.USER.current.last_name ? API.USER.current.last_name + ' ' : '')
                                                        + (API.USER.current.first_name  ? API.USER.current.first_name  + ' ' : '')
                                                        + (API.USER.current.middle_name ? API.USER.current.middle_name + ' ' : '')
                                                        + (API.USER.current.login       ? '(' + API.USER.current.login + ')' : '');
                                                    this.setValues({ user: userName });
                                                }
                                            })
                                        }
                                    },
                                    {
                                        id: "placeholder_footer"
                                    },
                                    {
                                        view: "template",
                                        id: "timer",
                                        borderless: true,
                                        autoheight: true,
                                        css: 'time_template',
                                        template: function (obj)
                                        {
                                            return obj.time ? timeTemplate(obj) : timeTemplate({ time: '---' });
                                        }
                                    }
                                ]
                        }
                    ],
                on:
                {
                    onDestruct: function ()
                    {
                        if (context.onDestruct)
                            context.onDestruct();
                    }
                }
            });

            if (complete)
                complete(mainLayout);
        };
        let setupTemplateHubs = function ()
        {
            demoView.setupHubs();
                
            if (context.timeHubProxy == null)
            {
                context.setupHubConnection('timeHub', function (timeHubProxy)
                {
                    if (timeHubProxy != null)
                    {
                        timeHubProxy.on('updateTime', updateTime);
                        context.timeHubProxy = timeHubProxy;
                    }
                });
            }
            if (context.eventsHubProxy == null)
            {
                context.setupHubConnection('eventsHub', function (eventsHubProxy)
                {
                    if (eventsHubProxy != null)
                    {
                        if (canViewEvents)
                        {
                            eventsHubProxy.on('newEvents', newEvents);
                            eventsHubProxy.on('ackEvents', ackEvents);
                            eventsHubProxy.on('ackAllEvents', ackAllEvents);
                        }
                        if (canViewAlarms)
                            eventsHubProxy.on('newAlarms', newAlarms);
                        if (canViewNotifications)
                            eventsHubProxy.on('newNotifications', newNotifications);
                        context.eventsHubProxy = eventsHubProxy;
                    }
                });
            }
            if (context.execHubProxy == null)
            {
                context.setupHubConnection('execHub', function (execHubProxy)
                {
                    if (execHubProxy != null)
                    {
                        execHubProxy.on('notifyResult', notifyExecutionResult);
                        execHubProxy.on('projectEvent', handleProjectEvent);
                        context.execHubProxy = execHubProxy;

                        // request initial event with service state
                        execHubProxy.onHubConnectionSuccess = () =>
                            execHubProxy.invoke('getProjectServiceState');
                    }
                });
            }
        };

    

        this.buildPageLayout = function (complete)
        {
        
            let content = webix.ui({
                view: "template"
                //id:   "content"
            });
            if (complete)
                complete(content);
        };

        this.buildTemplateComplete = function ()
        {
        };
        this.ready = function ()
        {
            // enabling CustomScroll
            //if (!webix.env.touch && webix.env.scrollSize)
            //webix.CustomScroll.init();

            try
            {
                // setupTemplateHubs();
                buildTemplateLayout(function (layout)
                {
                    if (context.buildPageLayout)
                        context.buildPageLayout(buildComplete);
                });
            }
            finally
            {
                executePing();
            }
        };

        this.setupHubConnection = function (hubName, setup) {
            API.HUBS.setupHubConnection(hubName, setup);    
        }

        this.onServerPingFailed = function ()
        {
        };
        this.onDestruct = function ()
        {
            demoView.dispose();

            /*
            if (context.timeHubProxy != null)
            {
                context.timeHubProxy.off('updateTime', updateTime);
                context.timeHubProxy.drop();
                context.timeHubProxy = null;
            }

            if (context.execHubProxy != null)
            {
                context.execHubProxy.off('notifyResult', notifyExecutionResult);
                context.execHubProxy.off('projectEvent', handleProjectEvent);
                context.execHubProxy.drop();
                context.execHubProxy = null;
            }

            if (context.eventsHubProxy != null)
            {
                context.eventsHubProxy.off('newEvents', newEvents);
                context.eventsHubProxy.off('ackEvents', ackEvents);
                context.eventsHubProxy.off('ackAllEvents', ackAllEvents);
                context.eventsHubProxy.off('newAlarms', newAlarms);
                context.eventsHubProxy.off('newNotifications', newNotifications);

                context.eventsHubProxy.drop();
                context.eventsHubProxy = null;
            }*/

            context.timeHubProxy?.stop();
            context.execHubProxy?.stop();
            context.eventsHubProxy?.stop();
        };

        // new events event
        let newEvents = function (events)
        {
            if (!canViewEvents)
                return;
            // update badge
            if (context.showEventsIcon)
            {
                let eventsWnd = $$('wndNotAckEvents');
                if (eventsWnd && !eventsWnd.isVisible())
                {
                    $$('not_ack_events').config.badge = '!';
                    $$('not_ack_events').refresh();
                }
            }

            if (events != null && events.length > 0 && newEventSubscribers.length > 0)
            {
                let playWarn = events.find(function (e) { return e.type == API.ENUMS.EventTypeValue.WARNING; }) != null;
                let playErr  = events.find(function (e) { return e.type == API.ENUMS.EventTypeValue.ERROR; })   != null;

                // play only one sound per newEvents
                if (playErr)
                    context.playSoundErr();
                else if (playWarn)
                    context.playSoundWrn();

                AJAX.post(API.FUNC.eventsGet, null, events.map(function (x) { return x.id; }),
                    function (xhr, rsp)
                    {
                        if (rsp != null)
                        {
                            newEventSubscribers.forEach(function (handler)
                            {
                                try
                                {
                                    handler.call(handler, rsp);
                                }
                                catch (e)
                                {
                                    HELP.log(e);
                                }
                            });
                        }
                    },
                    function (xhr, err)
                    {
                        HELP.log(err, xhr);
                        messageError(translate("common.errors.server_connection"));
                    });
            }
        };
        this.onNewEvents = function (handler)
        {
            if (handler && typeof handler === "function" && newEventSubscribers.indexOf(handler) < 0)
                newEventSubscribers.push(handler);
        };

        // ack events event
        let ackEvents = function (userID, events)
        {
            if (ackEventSubscribers.length > 0)
            {
                ackEventSubscribers.forEach(function (handler)
                {
                    try
                    {
                        handler.call(handler, userID, events);
                    }
                    catch (e)
                    {
                        HELP.log(e);
                    }
                });
            }
        };
        this.onAckEvents = function (handler)
        {
            if (handler && typeof handler === "function" && ackEventSubscribers.indexOf(handler) < 0)
                ackEventSubscribers.push(handler);
        };

        // ack all events event
        let ackAllEvents = function (userID, ackTime)
        {
            if (ackAllEventsSubscribers.length > 0)
            {
                ackAllEventsSubscribers.forEach(function (handler)
                {
                    try
                    {
                        handler.call(handler, userID, ackTime);
                    }
                    catch (e)
                    {
                        HELP.log(e);
                    }
                });
            }
        };
        this.onAckAllEvents = function (handler)
        {
            if (handler && typeof handler === "function" && ackAllEventsSubscribers.indexOf(handler) < 0)
                ackAllEventsSubscribers.push(handler);
        };

        let newAlarms = function (alarms)
        {
            if (!canViewAlarms)
                return;
            if (alarms != null && alarms.length > 0)
            {
                let alarmsWnd = $$('wndAlarms');
                if (alarmsWnd != null)
                {
                    // update badge
                    if (!alarmsWnd.isVisible())
                    {
                        if (alarms.find(function (x) { return x.active; }) != null)
                        {
                            let alm = $$('alarms');
                            if (alm.config.badge == null)
                            {
                                alm.config.badge = '!';
                                alm.refresh();
                            }
                        }
                    }
                    else
                        $$('tblAlarms').config.update(alarms);
                }
            }
        };
        let newNotifications = function (items)
        {
            if (!canViewNotifications)
                return;

            let grid = $$('tblNotifications');
            // accept all
            if (items == null)
                grid.clearAll();
            else if (items.length > 0)
            {
                let notificationsWnd = $$('wndNotifications');
                if (notificationsWnd != null)
                {
                    if (context.interactive)
                    {
                        if (!notificationsWnd.isVisible())
                            notificationsWnd.show();
                        else
                            grid.config.update(items);
                    }
                    else
                    {
                        // update badge
                        if (!notificationsWnd.isVisible())
                        {
                            if (items.find(function (x) { return !x.removed; }) != null)
                            {
                                let ntf = $$('notifications');
                                if (ntf.config.badge == null)
                                {
                                    ntf.config.badge = '!';
                                    ntf.refresh();
                                }
                            }
                        }
                        else
                            grid.config.update(items);
                    }
                }
            }
        };

        this.playSoundWrn = function ()
        {
            if (window.warning != null)
                API.SOUND.play(window.warning);
        };
        this.playSoundErr = function ()
        {
            if (window.error != null)
                API.SOUND.play(window.error);
        };

        window.dispatchEvent(templateReady);
    }, context));
    return context;
    })();


/**
 * Class for the project events window component.
 */
