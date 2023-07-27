// import * as webix from 'webix/webix.js';


import BindingsHandler from './Bindings';
import i18next from 'i18next';
import $ from "jquery";
import * as webix from 'webix/webix.js';
import * as signalR from "@microsoft/signalr";
import 'webix/webix.css';
import moment from 'moment';
import { Howl } from 'howler';
import 
{ HELP, 
  isNullOrEmpty, 
  AJAX, 
  parseBoolean, 
  parseNumber, 
  parseBooleanAsNumber,
  isDefined,
  GUID, 
} from './client'
const {
  $$
  } = webix
  
/*jshint unused:false,evil:true*/

var appReady = document.createEvent('CustomEvent');
appReady.initEvent('appready', true, false);

var appLocales = [
  { id: 'ru', key: 'ru-RU', value: 'RU' },
  { id: 'en', key: 'en-US', value: 'EN' },
  { id: 'fr', key: 'fr-FR', value: 'FR' },
];

if (typeof webix === 'object') {

  webix.ready(function () {
   
    // borrow Promise from webix
    if (window.Promise == null) window.Promise = webix.promise;

    // global ajax handler
    webix.attachEvent('onBeforeAjax', function (mode, url, data, request, headers, files, promise) {
      request.withCredentials = true;
      headers['Content-type'] = 'application/json';
    });

    // webix.UIManager Escape hotkey fix for IE ("Ai" is a mangling name).
    var webixkeycode = webix.UIManager._keycode || webix.UIManager.Ai;
    webix.UIManager._keycode = webix.UIManager.Ai = webix.bind(function (key, ctrl, shift, alt, meta) {
      var code = webixkeycode.apply(this, arguments);
      if (code.startsWith('esc_')) code = code.replace('esc_', 'escape_');
      return code;
    }, webix.UIManager);

    webix.customTableCheckbox = function (obj, common, value, config) {
      if (value == true || value == 'true') return "<div class='webix_table_checkbox webix_icon far fa-check-square'></div>";
      else return "<div class='webix_table_checkbox webix_icon far fa-square'></div>";
    };

    let filesBundle = [
        "thirdparty/moment/moment.min.js",
        "thirdparty/howler/howler.min.js",
        "scripts/client.js",
        "scripts/css/common.css",
    ]
    
    if (window.bundle != null) filesBundle = filesBundle.concat(window.bundle);
      let processPage = function (e) {
      /* LOCALIZATION INIT */
      if (window.i18next != null) {
        let lang = webix.storage.local.get('app.locale');
        if (isNullOrEmpty(lang)) {
          lang = 'ru';
          webix.storage.local.put('app.locale', lang);
        }

        let locale_options = {
          lng: lang,
          debug: false,
          getAsync: true,
          fallbackLng: 'ru',
          ns: ['app'],
          defaultNS: 'app',
          backend: {
            loadPath: 'i18n/{{lng}}.json',
            crossDomain: true,
          },
        };
        let currentLocale = appLocales.find(function (x) {
          return x.id === lang;
        });
        webix.i18n.setLocale(currentLocale ? currentLocale.key : 'ru-RU');

        if (window.i18nextXHRBackend != null) i18next.use(window.i18nextXHRBackend);

        i18next.on('languageChanged', function (new_lng) {
          let lang = webix.storage.local.get('app.locale');
          if (lang !== new_lng) {
            webix.storage.local.put('app.locale', new_lng);
            HELP.pageReload();
          }
        });
        i18next.init(locale_options, function (err, t) {
          window.translate = function (key) {
            return i18next.t(key.indexOf(':') < 0 ? 'app:' + key : key);
          };

          // custom webix formatting
          webix.i18n.fullDateFormat = '%d.%m.%Y %H:%i:%s';
          // webix.i18n.calendar.today = translate('common.now');
           webix.i18n.calendar.today = 'common.now';
          webix.i18n.setLocale();

          window.dispatchEvent(appReady);
        });
      }
    };
    $(window).on('tmplready', processPage);
    

    webix.require(filesBundle, function () {
      // custom isNotEmpty rule function
      webix.rules.isNotEmpty = function (val) {
        return !isNullOrEmpty(val);
      };
      webix.rules.isNumber = function (val) {
        if (isNullOrEmpty(val)) return false;
        if (typeof val === 'number') return isFinite(val);
        if (typeof val !== 'string') return false;
        val = val.replace(/\,/g, '.');
        return !isNaN(val);
      };
      /* string length rule */
      webix.rules.stringLength = function (min, max) {
        return function (val) {
          return val.length >= min && val.length <= max;
        };
      };
      /* string max length rule */
      webix.rules.maxLength = function (max) {
        return function (val) {
          return val.length <= max;
        };
      };
      // if no template
      if (window.template == null) processPage();
    });

    webix.message.position = 'top';
    webix.message.expire = 3000;

    window.messageError = function (text) {
      webix.message.apply(window.top || window, [text, 'error', 3000]);
    };
    window.messageInfo = function (text) {
      webix.message.apply(window.top || window, [text, 'info', 3000]);
    };
    window.messageSuccess = function (text) {
      webix.message.apply(window.top || window, [text, 'success', 3000]);
    };
    window.messageDebug = function (text) {
      webix.message.apply(window.top || window, [text, 'debug', 3000]);
    };
    window.messageConfirm = function (text, callback) {
      window.messageConfirmBox(text, callback);
      //webix.confirm({
      //    title:  translate("common.confirm"),
      //    ok:     translate("common.yes"),
      //    cancel: translate("common.no"),
      //    width:  300,
      //    type:   "confirm-warning",
      //    text:   text + " ?",
      //    callback: function (result)
      //    {
      //        if (callback != null)
      //            callback(result);
      //    }
      //});
    };
    window.messageConfirmBox = function (text, callback) {
      let box = webix.modalbox({
        type: 'alert-warning',
        title: 'common.confirm',
        buttons: ['common.yes', 'common.no' /*, translate("common.cancel")*/],
        width: 'auto',
        text: text + ' ?',
      });

      // hack
      let divbox = Object.values(webix.modalbox.pull)[0];
      let element = Object.values(divbox).find(function (x) {
        return x.tagName === 'DIV';
      });
      if (element != null) $(element).find("div[result='0']").addClass('confirm');

      box.then(function (result) {
        switch (result) {
          case '0':
            result = true;
            break;
          default:
            result = false;
        }

        if (callback != null) callback(result);
      });
    };
  });
}


  let API = {
    PREFIX: '/api/',
  };

  API.FUNC = {
    ping: API.PREFIX + 'ping',
    time: API.PREFIX + 'time',
    version: API.PREFIX + 'version',
    license: API.PREFIX + 'license',
    login: API.PREFIX + 'login',
    logout: API.PREFIX + 'logout',
    isDemo: API.PREFIX + 'isdemo',
    demoRest: API.PREFIX + 'demorest',
    queryMenu: API.PREFIX + 'menu',

    systemInfo: API.PREFIX + 'system/info',
    systemResources: API.PREFIX + 'system/resources',

    systemConfig: API.PREFIX + 'system/config',
    systemConfigUpdate: API.PREFIX + 'system/config/update',

    parameters: API.PREFIX + 'parameters',
    parametersRead: API.PREFIX + 'parameters/read',
    parametersWrite: API.PREFIX + 'parameters/write',

    configTree: API.PREFIX + 'modules/tree',
    equipmentsTree: API.PREFIX + 'equipments/tree',

    sectionStart: API.PREFIX + 'module/start',
    sectionStop: API.PREFIX + 'module/stop',
    sectionView: API.PREFIX + 'module/config/view',
    sectionConfig: API.PREFIX + 'module/config/data',
    sectionConfigXML: API.PREFIX + 'module/config/xml',

    moduleData: API.PREFIX + 'module/data',
    moduleResource: API.PREFIX + 'module/resource',
    moduleList: API.PREFIX + 'module/list',
    moduleSectionsList: API.PREFIX + 'module/sections',

    filesList: API.PREFIX + 'files/list',
    fileGet: API.PREFIX + 'files/get',
    filePut: API.PREFIX + 'files/put',
    fileSave: API.PREFIX + 'files/save',
    fileOpen: API.PREFIX + 'files/open',
    fileDelete: API.PREFIX + 'files/delete',
    fileDeleteAll: API.PREFIX + 'files/delete_all',

    eventsGet: API.PREFIX + 'events/get',
    eventGroups: API.PREFIX + 'events/groups',
    eventsList: API.PREFIX + 'events/list',
    eventsAck: API.PREFIX + 'events/ack',
    eventsAckList: API.PREFIX + 'events/ack_list',
    eventsAckAll: API.PREFIX + 'events/ack_all',
    eventsNotAckList: API.PREFIX + 'events/not_ack_list',

    alarmsList: API.PREFIX + 'alarms/list',
    notificationsList: API.PREFIX + 'notifications/list',
    notificationsAccept: API.PREFIX + 'notifications/accept',
    notificationsAcceptAll: API.PREFIX + 'notifications/accept_all',

    usersList: API.PREFIX + 'users/list',
    rolesList: API.PREFIX + 'roles/list',
    permissionsList: API.PREFIX + 'permissions/list',
    rolePermissions: API.PREFIX + 'role/permissions',
    userRolesList: API.PREFIX + 'user/roles',
    userGet: API.PREFIX + 'user/get',
    userCreate: API.PREFIX + 'user/create',
    userUpdate: API.PREFIX + 'user/update',
    userDelete: API.PREFIX + 'user/delete',
    userPassword: API.PREFIX + 'user/pwd',
    systemPassword: API.PREFIX + 'user/syspwd',
    roleCreate: API.PREFIX + 'role/create',
    roleUpdate: API.PREFIX + 'role/update',
    roleDelete: API.PREFIX + 'role/delete',
    domainsSearch: API.PREFIX + 'domains/search',
    domainUsersList: API.PREFIX + 'domain/users',
    domainUserGet: API.PREFIX + 'domain/user',
    domainUserCheck: API.PREFIX + 'domain/user/check',

    projectSave: API.PREFIX + 'project/save',
    projectList: API.PREFIX + 'project/list',
    projectGetFile: API.PREFIX + 'project/getFile',
    projectDelete: API.PREFIX + 'project/delete',
    projectDeleteAll: API.PREFIX + 'project/delete_all',
    projectUpload: API.PREFIX + 'project/upload',
    projectCreate: API.PREFIX + 'project/create',
    projectLoad: API.PREFIX + 'project/load',

    schemeAdd: API.PREFIX + 'scheme/add',
    schemeGet: API.PREFIX + 'scheme/get',
    schemeList: API.PREFIX + 'scheme/list',
    schemeUpdate: API.PREFIX + 'scheme/update',
    schemeSave: API.PREFIX + 'scheme/save',
    schemeDelete: API.PREFIX + 'scheme/delete',
    schemeDeleteAll: API.PREFIX + 'scheme/clear',

    cameraShot: API.PREFIX + 'cameras/shot',
    cameraCustomView: API.PREFIX + 'cameras/custom/view',
  };

  API.FORMAT = {
    REGEX: {
      MILLISEC: new RegExp(/(?:[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2})(?:(?:\.)([0-9]{0,7}))?(?:[z+-])?/),
      PARSE_DATETIME: new RegExp(/([0-9]{1,2})\.([0-9]{1,2})\.([0-9]{2,4})\s([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})(?:\.)(([0-9]{0,7}))?([+-][0-9]{1,2}:[0-9]{1,2})?([z])?/),
    },

    getValue: function (data) {
      if (data == null || data.v == null) return '';

      let value = data.v;
      let values = API.ENUMS.TagValueType;

      switch (data.vtype) {
        case values.None:
        case values.Object:
        case values.Char:
          return value;
        case values.Boolean:
          return parseBoolean(value);
        case values.SByte:
        case values.Byte:
        case values.Int16:
        case values.UInt16:
        case values.Int32:
        case values.UInt32:
          return parseNumber(value, 0);
        case values.Int64:
        case values.UInt64:
          return value; // as string
        case values.Single:
        case values.Double:
        case values.Decimal:
          return parseNumber(value, 0, 6);
        case values.DateTime:
        case values.TimeOffset:
          return API.FORMAT.getRawTimestamp(value);
        case values.String:
        case values.Guid:
          return value;
        case values.TimeSpan:
          return API.FORMAT.getTimespan(value);
        case values.Enum: {
          let item = data.ev[value];
          return item != null ? item : value;
        }
        case values.Array:
          return value.join ? value.join() : value;
        default: {
          HELP.log('Unknown parameter value type:' + data.vtype);
        }
      }
      return value;
    },
    getTrendTableValue: function (value, vType) {
      const types = API.ENUMS.TagValueType;
      switch (vType) {
        case types.Boolean:
          return parseBooleanAsNumber(value);
        case types.SByte:
        case types.Byte:
        case types.Int16:
        case types.UInt16:
        case types.Int32:
        case types.UInt32:
        case types.Enum:
          return parseNumber(value, 0);
        case types.Single:
        case types.Double:
        case types.Decimal:
          // работает от -1.797693134862316e+301 до +1.797693134862316e+301
          return parseNumber(value, 0, 6);
        case types.DateTime:
        case types.TimeOffset:
          return API.FORMAT.getRawTimestamp(value);
        case types.TimeSpan:
          return API.FORMAT.getTimespan(value);
        case types.Array:
          return value.join ? value.join() : value;
        case types.Int64:
        case types.UInt64:
        default:
          return value;
      }
    },
    getTrendValue: function (value, vType) {
      const types = API.ENUMS.TagValueType;
      switch (vType) {
        case types.Boolean:
          return parseBooleanAsNumber(value);
        case types.SByte:
        case types.Byte:
        case types.Int16:
        case types.UInt16:
        case types.Int32:
        case types.UInt32:
        case types.Int64:
        case types.UInt64:
        case types.Enum:
          return parseNumber(value, 0);
        case types.Single:
        case types.Double:
        case types.Decimal:
          return parseNumber(value, 0, 6);
        default:
          return 0;
      }
    },
    getDefault: function (vtype) {
      if (!isDefined(vtype)) return null;

      let type = API.ENUMS.TagValueType;
      switch (vtype) {
        case type.None:
        case type.Object:
          return null;
        case type.Char:
          return '\0';
        case type.Boolean:
          return false;
        case type.SByte:
        case type.Byte:
        case type.Int16:
        case type.UInt16:
        case type.Int32:
        case type.UInt32:
        case type.Int64:
        case type.UInt64:
          return 0;
        case type.Single:
        case type.Double:
        case type.Decimal:
          return 0.0;
        case type.DateTime:
        case type.TimeOffset:
          return API.FORMAT.getDateTimeString(new Date(0));
        case type.String:
          return '';
        case type.Guid:
          return GUID.EMPTY;
        case type.TimeSpan:
          return API.FORMAT.getTimeString(new Date(0));
        case type.Enum:
          return '';
        case type.Array:
          return [];
        default: {
          //--->fix---//
          //HELP.log('Unknown value type:' + data.vtype);
          HELP.log('Unknown value type:');
          //--->fix---//
          return null;
        }
      }
    },
    getMeasure: function (data) {
      if (data == null || data.m == null) return '';
      return data.m;
    },
    getQuality: function (data) {
      if (data == null || data.q == null) return '';
      return API.ENUMS.Quality[data.q];
    },

    getRawTimestamp: function (value, precision) {
      if (typeof value !== 'string' || isNullOrEmpty(value)) return '';
      let result = API.FORMAT.getDateTimeString(value, 'DD.MM.YYYY HH:mm:ss');
      precision = precision == null ? 3 : precision >= 0 && precision <= 7 ? precision : 3;
      if (precision > 0) {
        let matches = value.match(API.FORMAT.REGEX.MILLISEC);
        if (matches != null && matches[1] != null) result += '.' + matches[1].substring(0, precision);
      }
      return result;
    },
    getDate: function (value) {
      if (typeof value !== 'string' || isNullOrEmpty(value) || window.moment == null) return null;
      let mtime = moment(value);
      if (!mtime.isValid()) return null;
      return mtime.toDate();
    },
    getDateString: function (date, format) {
      if (date == null || date == null || window.moment == null) return '';
      return moment(date).format(format || 'DD.MM.YYYY');
    },
    getTimeString: function (date, format) {
      if (date == null || date == null || window.moment == null) return '';
      return moment(date).format(format || 'HH:mm:ss.SSS');
    },
    getDateTimeString: function (date, format) {
      if (date == null || isNullOrEmpty(date) || window.moment == null) return '';
      return moment(date).format(format || 'DD.MM.YYYY HH:mm:ss.SSS');
    },
    getTimespan: function (value) {
      if (value == null || isNullOrEmpty(value) || window.moment == null) return '';
      if (!moment(value).isValid()) return '';
      return value;
    },
    extractUtcDate: function (date) {
      const ms = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
      return new Date(ms);
    },
    dateDiffInDays: function (a, b) {
      const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
      const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
      const _MS_PER_DAY = 1000 * 60 * 60 * 24;

      return Math.floor((utc1 - utc2) / _MS_PER_DAY);
    },
    substractDays: function (date, days) {
      const retVal = new Date(date);
      retVal.setDate(retVal.getDate() - days);
      return retVal;
    },
    getCleanDate(d) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    },
    /**
     *
     * @param d js Date
     * @returns ISO UTC string with date from input.
     *          Does not calculate the browser time zone.
     */
    getNetDateString(d) {
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const yyyy = d.getFullYear();
      const dd = day > 9 ? day : '0' + day;
      const mm = month > 9 ? month : '0' + month;
      return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
    },
    /**
     * Format bytes as human-readable text.
     *
     * https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string/10420404
     *
     * @param bytes Number of bytes.
     * @param si False to use metric (SI) units, aka powers of 1000. True to use
     *           binary (IEC), aka powers of 1024.
     * @param dp Number of decimal places to display.
     *
     * @return Formatted string.
     */
    getPrettySize(bytes, si = false, dp = 1) {
      const thresh = si ? 1000 : 1024;

      if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
      }

      // const units = si
      //   ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      //   : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
      const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

      let u = -1;
      const r = 10 ** dp;

      do {
        bytes /= thresh;
        ++u;
      } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

      return bytes.toFixed(dp) + ' ' + units[u];
    },
  };

  API.USER = {
    login: function (usr, pwd, failed) {
      AJAX.post(API.FUNC.login, null, { login: usr, password: pwd }, HELP.pageReload, failed);
    },
    logout: function () {
      //AJAX.post(API.FUNC.logout, null, HELP.pageReload, HELP.pageReload);
      AJAX.post(API.FUNC.logout, null, null, () => {
        // location.href = '/';
        window.location.href = '/';
      });
    },
    refresh: function (callback) {
      AJAX.get(
        //------>fix<--------//
        null,
         //------>fix<--------//
        null,
        function (xhr, 
           //------>fix<--------//
          res = {
          "id": "b73f535f-65fb-4af3-847d-849dd30eee8f",
          "login": "system",
          "first_name": "система",
          "system": true,
          "ad_auth": false,
          "ad_domain": "",
          "roles": [
              {
                  "id": "44931bcf-f666-429d-83c0-74070502cd8d",
                  "name": "Супер администратор",
                  "system": false
              }
          ],
          "permissions": [
              {
                  "id": 65535,
                  "name": "god.mode",
                  "desc": "Все права",
                  "system": false
              }
          ]
      }
       //------>fix<--------//
      ) {
          API.USER.current = res;
          if (typeof callback === 'function') callback();
        },
        function (xhr, err) {
          HELP.log(err);
          API.USER.logout();
        }
      );
    },
    hasPermission: function (permission) {
      return API.USER.hasAnyPermission(permission);
    },
    hasAnyPermission: function (permissions) {
      if (permissions != null) {
        var user = API.USER.current;
        if (user == null || user.permissions == null) return false;
        if (typeof permissions === 'string') permissions = permissions.split(',');
        // check is array
        if (Array.isArray(permissions)) {
          for (var idx = 0; idx < permissions.length; idx++) {
            let perm = permissions[idx].trim();
            if (
              perm != null &&
              user.permissions.find(function (x) {
                return x.name === 'god.mode' || x.name === perm;
              }) != null
            )
              return true;
          }
        }
      }
      return false;
    },
  };

  API.ENUMS = {
    ModuleState: {
      STARTED: 0x01,
      STOPPED: 0x02,
      LAUNCHING: 0x04,
      HALTING: 0x08,
      FAILURE: 0x10,
      STARTED_FAILURE: 0x11,
      // RC (REMOTE CONTROL)
      RC: 0x20,
      RC_STARTED: 0x21,
      RC_STOPPED: 0x22,
      RC_LAUNCHING: 0x24,
      RC_HALTING: 0x28,
      RC_FAILURE: 0x30,
      RC_STARTED_FAILURE: 0x31,
    },
    ModuleStatus: {
      0x01: 'started',
      0x02: 'stopped',
      0x04: 'launching',
      0x08: 'halting',
      0x10: 'failure',
      0x11: 'started_failure',
      0x20: 'rc',
      0x21: 'rc_started',
      0x22: 'rc_stopped',
      0x24: 'rc_launching',
      0x28: 'rc_halting',
      0x30: 'rc_failure',
      0x31: 'rc_started_failure',
    },
    ModuleStateName: {
      get 0x01() {
        return 'common.states.started';
      },
      get 0x02() {
        return'common.states.stopped';
      },
      get 0x04() {
        return 'common.states.launching';
      },
      get 0x08() {
        return 'common.states.halting';
      },
      get 0x10() {
        return 'common.states.failure';
      },
      get 0x11() {
        return 'common.states.started_failure';
      },
      get 0x20() {
        return 'common.states.rc';
      },
      get 0x21() {
        return 'common.states.rc_started';
      },
      get 0x22() {
        return 'common.states.rc_stopped';
      },
      get 0x24() {
        return 'common.states.rc_launching';
      },
      get 0x28() {
        return 'common.states.rc_halting';
      },
      get 0x30() {
        return 'common.states.rc_failure';
      },
      get 0x31() {
        return 'common.states.rc_started_failure';
      },
    },
    ModuleType: {
      NONE: 0,
      PROTOCOL: 1,
      SUPPORT: 2,
      USER: 3,
    },
    Quality: {
      0x00: 'Bad', // 0
      0x04: 'Bad_ConfigurationError', // 4
      0x08: 'Bad_NotConnected', // 8
      0x0c: 'Bad_DeviceFailure', // 12
      0x10: 'Bad_SensorFailure', // 16
      0x14: 'Bad_LastKnownValue', // 20
      0x18: 'Bad_CommFailure', // 24
      0x1c: 'Bad_OutOfService', // 28
      0x20: 'Bad_WaitingForInitialData', // 32
      0x40: 'Uncertain', // 64
      0x44: 'Uncertain_LastUsableValue', // 68
      0x50: 'Uncertain_SensorNotAccurate', // 80
      0x54: 'Uncertain_EUExceeded', // 84
      0x58: 'Uncertain_SubNormal', // 88
      0xc0: 'Good', // 192
      0xd8: 'Good_LocalOverride', // 216
    },
    QualityValue: {
      Bad: 0x00, // 0
      Bad_ConfigurationError: 0x04, // 4
      Bad_NotConnected: 0x08, // 8
      Bad_DeviceFailure: 0x0c, // 12
      Bad_SensorFailure: 0x10, // 16
      Bad_LastKnownValue: 0x14, // 20
      Bad_CommFailure: 0x18, // 24
      Bad_OutOfService: 0x1c, // 28
      Bad_WaitingForInitialData: 0x20, // 32
      Uncertain: 0x40, // 64
      Uncertain_LastUsableValue: 0x44, // 68
      Uncertain_SensorNotAccurate: 0x50, // 80
      Uncertain_EUExceeded: 0x54, // 84
      Uncertain_SubNormal: 0x58, // 88
      Good: 0xc0, // 192
      Good_LocalOverride: 0xd8, // 216
    },
    AcceptanceResult: {
      get 0x00() {
        return 'common.cmd_confirmation.unknown';
      },
      get 0x01() {
        return 'common.cmd_confirmation.accepted';
      },
      get 0x02() {
        return 'common.cmd_confirmation.error';
      },
      get 0x03() {
        return 'common.cmd_confirmation.running';
      },
    },
    DPI: {
      // 00
      get 0x00() {
        return 'common.dpi.error';
      },
      // 01
      get 0x01() {
        return 'common.dpi.off';
      },
      // 10
      get 0x02() {
        return 'common.dpi.on';
      },
      // 11
      get 0x03() {
        return 'common.dpi.damage';
      },
    },
    TagType: {
      INFO: 0x00,
      MEASURE: 0x10,
      TS: 0x11,
      STATE: 0x20,
      STATE_BIT: 0x21,
      DIAGNOSTICS: 0x22,
      COMMAND: 0x50,
      SETTING: 0x51,
      EVENT: 0x100,
      FILE: 0x200,
      FIXED: 0x300,
      CUSTOM: 0x500,
    },
    TagValueType: {
      None: 0x00,
      Object: 0x01,
      Boolean: 0x03,
      Char: 0x04,
      SByte: 0x05,
      Byte: 0x06,
      Int16: 0x07,
      UInt16: 0x08,
      Int32: 0x09,
      UInt32: 0x0a,
      Int64: 0x0b,
      UInt64: 0x0c,
      Single: 0x0d,
      Double: 0x0e,
      Decimal: 0x0f,
      DateTime: 0x10,
      String: 0x12,

      Guid: 0x64,
      TimeSpan: 0x66,
      TimeOffset: 0x68,

      Enum: 0x6e,
      Array: 0x6f,

      getKey: function (val) {
        return Object.keys(this).find(function (key) {
          return this[key] === val;
        }, this);
      },
      isNumber: function (val) {
        return val >= API.ENUMS.TagValueType.SByte && val <= API.ENUMS.TagValueType.Decimal;
      },
    },
    EventType: {
      get INFO() {
        return 'common.events.info';
      },
      get ALARM() {
        return 'common.events.alarm';
      },
      get EVENT() {
        return 'common.events.event';
      },
      get WARNING() {
        return 'common.events.warning';
      },
      get DAMAGE() {
        return 'common.events.damage';
      },
      get ERROR() {
        return 'common.events.damage' + '/' + 'common.events.error';
      },
    },
    EventTypeName: {
      0x01: 'INFO',
      0x02: 'WARNING',
      0x03: 'ERROR',
    },
    EventTypeValue: {
      INFO: 0x01,
      WARNING: 0x02,
      ERROR: 0x03,
    },
    JournalTypeName: {
      0x01: 'EVENT',
      0x02: 'ALARM',
      0x04: 'DAMAGE',
    },
  };

  API.SERIAL = {
    baud_rates: {
      // @if !LINKMT
      110: '110',
      300: '300',
      600: '600',
      1200: '1200',
      2400: '2400',
      4800: '4800',
      // @endif
      9600: '9600',
      // @if !LINKMT
      14400: '14400',
      // @endif
      19200: '19200',
      38400: '38400',
      // @if !LINKMT
      56000: '56000',
      // @endif
      57600: '57600',
      115200: '115200',
      // @if !LINKMT
      128000: '128000',
      256000: '256000',
      // @endif
    },
    get baud_rates_array() {
      let arr = [];
      for (var x in API.SERIAL.baud_rates) arr.push({ id: x, value: API.SERIAL.baud_rates[x] });
      return arr;
    },

    data_bits: {
      5: '5',
      6: '6',
      7: '7',
      8: '8',
    },
    get data_bits_array() {
      let arr = [];
      for (var x in API.SERIAL.data_bits) arr.push({ id: x, value: API.SERIAL.data_bits[x] });
      return arr;
    },

    parities: {
      get 0() {
        return 'common.parities.no';
      },
      get 1() {
        return 'common.parities.odd';
      },
      get 2() {
        return 'common.parities.even';
      },
      // @if !LINKMT
      get 3() {
        return 'common.parities.mark';
      },
      get 4() {
        return 'common.parities.space';
      },
      // @endif
    },
    get parities_array() {
      let arr = [];
      for (var x in API.SERIAL.parities) arr.push({ id: x, value: API.SERIAL.parities[x] });
      return arr;
    },

    stop_bits: {
      // @if !LINKMT
      get 0() {
        return 'common.parities.no';
      },
      // @endif
      1: '1',
      2: '2',
      // @if !LINKMT
      3: '1.5',
      // @endif
    },
    get stop_bits_array() {
      let arr = [];
      for (var x in API.SERIAL.stop_bits) arr.push({ id: x, value: API.SERIAL.stop_bits[x] });
      return arr;
    },

    flow_control: {
      get 0() {
        return 'common.parities.no';
      },
      1: 'RTS/CTS',
      2: 'DTR/DSR',
    },
    get flow_control_array() {
      let arr = [];
      for (var x in API.SERIAL.flow_control) arr.push({ id: x, value: API.SERIAL.flow_control[x] });
      return arr;
    },

    validate_port: function (val) {
      const winPattern = new RegExp('^COM[0-9]{1,}?$');
      return winPattern.test(val) || val.startsWith('/dev/tty');
    },
  };

  API.STATE = {
    resolve: function (state) {
      let forceStart = false;
      switch (parseInt(state, 10)) {
        case API.ENUMS.ModuleState.STARTED:
        case API.ENUMS.ModuleState.LAUNCHING:
        case API.ENUMS.ModuleState.FAILURE:
        case API.ENUMS.ModuleState.STARTED_FAILURE:
          forceStart = false;
          break;
        case API.ENUMS.ModuleState.STOPPED:
        case API.ENUMS.ModuleState.HALTING:
          forceStart = true;
          break;
        case API.ENUMS.ModuleState.RC:
        case API.ENUMS.ModuleState.RC_STARTED:
        case API.ENUMS.ModuleState.RC_LAUNCHING:
        case API.ENUMS.ModuleState.RC_FAILURE:
        case API.ENUMS.ModuleState.RC_STARTED_FAILURE:
        case API.ENUMS.ModuleState.RC_STOPPED:
        case API.ENUMS.ModuleState.RC_HALTING:
          throw new Error('common.errors.control_blocked');
        default:
          throw new Error ('common.errors.unknown_state');
      }
      return forceStart;
    },
  };

  API.IPV4 = {
    validate: function (val) {
      let pattern = new RegExp('^(((0|1)?[0-9][0-9]?|2[0-4][0-9]|25[0-5])[.]){3}((0|1)?[0-9][0-9]?|2[0-4][0-9]|25[0-5])$');
      return pattern.test(val);
    },
    validate_port: function (val) {
      let pattern = new RegExp('^(((0|1)?[0-9][0-9]?|2[0-4][0-9]|25[0-5])[.]){3}((0|1)?[0-9][0-9]?|2[0-4][0-9]|25[0-5])(:[0-9]{1,5})?$');
      return pattern.test(val);
    },
  };

  API.FILETYPES = {
    get DEV() {
      return { id: '7E970759-B128-433B-8F1A-60B62CEEE2AE', name: 'files.dev.name', desc: 'files.dev.desc', value: 'DEV', icon: 'laptop' };
    },
    get S_SCRIPT() {
      return { id: 'F65F4BC8-E0C3-4255-B4E6-83B81A03397A', name: 'files.sscript.name', desc: 'files.sscript.desc', value: 'S_SCRIPT', icon: 'code' };
    },
    get C_SCRIPT() {
      return { id: '3D466359-5E5C-4E78-81C3-24636FC091C7', name: 'files.cscript.name', desc: 'files.cscript.desc', value: 'C_SCRIPT', icon: 'code' };
    },
    get JRN() {
      return { id: '9D90D2B6-518A-40C3-A3A7-044DBBF5AD4F', name: 'files.jrn.name', desc: 'files.jrn.desc', value: 'JRN', icon: 'list' };
    },
    get OSC() {
      return { id: 'E3D8938E-431B-4983-85C2-A4B6D1E44D73', name: 'files.osc.name', desc:'files.osc.desc', value: 'OSC', icon: 'image' };
    },
    get USER() {
      return { id: 'B7A5C9C6-B698-4ABC-8175-81D1F57220A7', name: 'files.user.name', desc: 'files.user.desc', value: 'USER', icon: 'user' };
    },
    get LOG() {
      return { id: '390AE703-42BA-47D9-B18A-F7D6445CC4FB', name: 'files.log.name', desc: 'files.log.desc', value: 'LOG', icon: 'file' };
    },
  };

  API.SOUND = {
    play: function (src, loop) {
      API.SOUND.stop();
      this.sid = new Howl({
        src: [src],
        autoplay: false,
        preload: true,
        mute: false,
        loop: loop != null ? loop : false,
        volume: 1,
      });
      return this.sid.play();
    },
    stop: function (id) {
      if (this.sid) this.sid.stop();
    },
  };

  API.POSTERS = {
    metadata: [
      {
        key: 'menAtWork',
        title: 'Не включать! Работают люди!',
        priority: 0,
        src: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjIwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCA1Mi45MTY2NjUgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJkb250X3N3aXRjaF9tZW5fYXRfd29yay5zdmciCiAgIGlua3NjYXBlOnZlcnNpb249IjEuMC4yLTIgKGU4NmM4NzA4NzksIDIwMjEtMDEtMTUpIj4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgb2JqZWN0dG9sZXJhbmNlPSIxMCIKICAgICBncmlkdG9sZXJhbmNlPSIxMCIKICAgICBndWlkZXRvbGVyYW5jZT0iMTAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwMSIKICAgICBpZD0ibmFtZWR2aWV3OSIKICAgICBzaG93Z3JpZD0idHJ1ZSIKICAgICBpbmtzY2FwZTp6b29tPSI0LjI5NTY3MzciCiAgICAgaW5rc2NhcGU6Y3g9Ijg3Ljg2OTg1OSIKICAgICBpbmtzY2FwZTpjeT0iNDUuNjI1NTExIgogICAgIGlua3NjYXBlOndpbmRvdy14PSItOSIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iLTkiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiCiAgICAgaW5rc2NhcGU6ZG9jdW1lbnQtcm90YXRpb249IjAiCiAgICAgc2hvd2d1aWRlcz0iZmFsc2UiPgogICAgPGlua3NjYXBlOmdyaWQKICAgICAgIHR5cGU9Inh5Z3JpZCIKICAgICAgIGlkPSJncmlkODMzIiAvPgogIDwvc29kaXBvZGk6bmFtZWR2aWV3PgogIDxkZWZzCiAgICAgaWQ9ImRlZnMyIiAvPgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTUiPgogICAgPHJkZjpSREY+CiAgICAgIDxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj4KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4KICAgICAgICA8ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+CiAgICAgICAgPGRjOnRpdGxlIC8+CiAgICAgIDwvY2M6V29yaz4KICAgIDwvcmRmOlJERj4KICA8L21ldGFkYXRhPgogIDxnCiAgICAgaWQ9ImxheWVyMSIKICAgICBzdHlsZT0ic3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiCiAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4yNjQ1ODMzMiwwLjI2NDU4MTUzKSI+CiAgICA8cmVjdAogICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6I2ZmZmZmZjtzdHJva2Utd2lkdGg6MS4wNTgzMzMzMztzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIgogICAgICAgaWQ9InJlY3QxMiIKICAgICAgIHdpZHRoPSI1MS44NTgzMzQiCiAgICAgICBoZWlnaHQ9IjI1LjQiCiAgICAgICB4PSIwLjI2NDU4MzMyIgogICAgICAgeT0iMC4yNjQ1ODM1IiAvPgogICAgPHRleHQKICAgICAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC13ZWlnaHQ6bm9ybWFsO2ZvbnQtc2l6ZTo2LjM1cHg7bGluZS1oZWlnaHQ6MS4yNTtmb250LWZhbWlseTpzYW5zLXNlcmlmO2ZpbGw6I2ZmMDAwMDtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MS4wNTgzMztzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIKICAgICAgIHg9IjQ3LjEwOTgzNyIKICAgICAgIHk9IjEyLjgzMTgzMiIKICAgICAgIGlkPSJ0ZXh0MTYiPjx0c3BhbgogICAgICAgICB4PSIyNi4xMTgxOTgiCiAgICAgICAgIHk9IjEyLjgzMTgzMiIKICAgICAgICAgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtdmFyaWFudDpub3JtYWw7Zm9udC13ZWlnaHQ6Ym9sZDtmb250LXN0cmV0Y2g6Y29uZGVuc2VkO2ZvbnQtc2l6ZTo2LjM1cHg7Zm9udC1mYW1pbHk6QXJpYWw7LWlua3NjYXBlLWZvbnQtc3BlY2lmaWNhdGlvbjonQXJpYWwgQm9sZCBDb25kZW5zZWQnO3RleHQtYWxpZ246Y2VudGVyO3RleHQtYW5jaG9yOm1pZGRsZTtmaWxsOiNmZjAwMDA7c3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiCiAgICAgICAgIGlkPSJ0c3BhbjE4Ij7QndCVINCS0JrQm9Cu0KfQkNCi0KwhPC90c3Bhbj48L3RleHQ+CiAgICA8dGV4dAogICAgICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIKICAgICAgIHN0eWxlPSJmb250LXN0eWxlOm5vcm1hbDtmb250LXdlaWdodDpub3JtYWw7Zm9udC1zaXplOjQuOTM4ODlweDtsaW5lLWhlaWdodDoxLjI1O2ZvbnQtZmFtaWx5OnNhbnMtc2VyaWY7ZmlsbDojZmYwMDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIgogICAgICAgeD0iNDcuMTI4OTEiCiAgICAgICB5PSIxOC4yMjE0OTEiCiAgICAgICBpZD0idGV4dDE2LTUiPjx0c3BhbgogICAgICAgICB4PSIyNi4xMzcyNjYiCiAgICAgICAgIHk9IjE4LjIyMTQ5MSIKICAgICAgICAgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtdmFyaWFudDpub3JtYWw7Zm9udC13ZWlnaHQ6Ym9sZDtmb250LXN0cmV0Y2g6bm9ybWFsO2ZvbnQtc2l6ZTo0LjkzODg5cHg7Zm9udC1mYW1pbHk6QXJpYWw7LWlua3NjYXBlLWZvbnQtc3BlY2lmaWNhdGlvbjonQXJpYWwgQm9sZCc7dGV4dC1hbGlnbjpjZW50ZXI7dGV4dC1hbmNob3I6bWlkZGxlO2ZpbGw6I2ZmMDAwMDtzdHJva2Utd2lkdGg6MS4wNTgzMztzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIKICAgICAgICAgaWQ9InRzcGFuMTgtMyI+0YDQsNCx0L7RgtCw0Y7RgiDQu9GO0LTQuDwvdHNwYW4+PC90ZXh0PgogICAgPHJlY3QKICAgICAgIHN0eWxlPSJmaWxsOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOiNmZjAwMDA7c3Ryb2tlLXdpZHRoOjIuNjQ1ODM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgIGlkPSJyZWN0MTItOCIKICAgICAgIHdpZHRoPSI0OC4xNTQxNjciCiAgICAgICBoZWlnaHQ9IjIxLjY5NTgzMyIKICAgICAgIHg9IjIuMTE2NjY0OSIKICAgICAgIHk9IjIuMTE2NjY2OCIgLz4KICA8L2c+Cjwvc3ZnPgo=',
      },
      {
        key: 'workOnLine',
        title: 'Не включать! Работа на линии!',
        priority: 1,
        src: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjIwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCA1Mi45MTY2NjUgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJkb250X3N3aXRjaF93b3JrX29uX2xpbmUuc3ZnIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIxLjAuMi0yIChlODZjODcwODc5LCAyMDIxLTAxLTE1KSI+CiAgPHNvZGlwb2RpOm5hbWVkdmlldwogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBib3JkZXJvcGFjaXR5PSIxIgogICAgIG9iamVjdHRvbGVyYW5jZT0iMTAiCiAgICAgZ3JpZHRvbGVyYW5jZT0iMTAiCiAgICAgZ3VpZGV0b2xlcmFuY2U9IjEwIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIgogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxOTIwIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwMDEiCiAgICAgaWQ9Im5hbWVkdmlldzkiCiAgICAgc2hvd2dyaWQ9InRydWUiCiAgICAgaW5rc2NhcGU6em9vbT0iMy4wMzc1IgogICAgIGlua3NjYXBlOmN4PSIxMy44MTgzMDIiCiAgICAgaW5rc2NhcGU6Y3k9IjI3LjkxODQ2OCIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iLTkiCiAgICAgaW5rc2NhcGU6d2luZG93LXk9Ii05IgogICAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgICAgaW5rc2NhcGU6Y3VycmVudC1sYXllcj0ibGF5ZXIxIgogICAgIGlua3NjYXBlOmRvY3VtZW50LXJvdGF0aW9uPSIwIj4KICAgIDxpbmtzY2FwZTpncmlkCiAgICAgICB0eXBlPSJ4eWdyaWQiCiAgICAgICBpZD0iZ3JpZDgzMyIgLz4KICA8L3NvZGlwb2RpOm5hbWVkdmlldz4KICA8ZGVmcwogICAgIGlkPSJkZWZzMiIgLz4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGE1Ij4KICAgIDxyZGY6UkRGPgogICAgICA8Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+CiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CiAgICAgICAgPGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPgogICAgICAgIDxkYzp0aXRsZSAvPgogICAgICA8L2NjOldvcms+CiAgICA8L3JkZjpSREY+CiAgPC9tZXRhZGF0YT4KICA8ZwogICAgIGlkPSJsYXllcjEiCiAgICAgc3R5bGU9InN0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIgogICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMjY0NTgzMzIsMC4yNjQ1ODE1MykiPgogICAgPHJlY3QKICAgICAgIHN0eWxlPSJmaWxsOiNmZjAwMDA7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOiNmZmZmZmY7c3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgIGlkPSJyZWN0MTIiCiAgICAgICB3aWR0aD0iNTEuODU4MzM0IgogICAgICAgaGVpZ2h0PSIyNS40IgogICAgICAgeD0iMC4yNjQ1ODMzMiIKICAgICAgIHk9IjAuMjY0NTgzNSIgLz4KICAgIDx0ZXh0CiAgICAgICB4bWw6c3BhY2U9InByZXNlcnZlIgogICAgICAgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtd2VpZ2h0Om5vcm1hbDtmb250LXNpemU6Ni4zNXB4O2xpbmUtaGVpZ2h0OjEuMjU7Zm9udC1mYW1pbHk6c2Fucy1zZXJpZjtmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiCiAgICAgICB4PSI0Ny4xMDk4MzciCiAgICAgICB5PSIxMi44MzE4MzIiCiAgICAgICBpZD0idGV4dDE2Ij48dHNwYW4KICAgICAgICAgeD0iMjYuMTE4MTk4IgogICAgICAgICB5PSIxMi44MzE4MzIiCiAgICAgICAgIHN0eWxlPSJmb250LXN0eWxlOm5vcm1hbDtmb250LXZhcmlhbnQ6bm9ybWFsO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zdHJldGNoOmNvbmRlbnNlZDtmb250LXNpemU6Ni4zNXB4O2ZvbnQtZmFtaWx5OkFyaWFsOy1pbmtzY2FwZS1mb250LXNwZWNpZmljYXRpb246J0FyaWFsIEJvbGQgQ29uZGVuc2VkJzt0ZXh0LWFsaWduOmNlbnRlcjt0ZXh0LWFuY2hvcjptaWRkbGU7ZmlsbDojZmZmZmZmO3N0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIgogICAgICAgICBpZD0idHNwYW4xOCI+0J3QlSDQktCa0JvQrtCn0JDQotCsITwvdHNwYW4+PC90ZXh0PgogICAgPHRleHQKICAgICAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC13ZWlnaHQ6bm9ybWFsO2ZvbnQtc2l6ZTo0LjkzODg5cHg7bGluZS1oZWlnaHQ6MS4yNTtmb250LWZhbWlseTpzYW5zLXNlcmlmO2ZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MS4wNTgzMztzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIKICAgICAgIHg9IjQ3LjEyODkxIgogICAgICAgeT0iMTguMjIxNDkxIgogICAgICAgaWQ9InRleHQxNi01Ij48dHNwYW4KICAgICAgICAgeD0iMjYuMTM3MjY2IgogICAgICAgICB5PSIxOC4yMjE0OTEiCiAgICAgICAgIHN0eWxlPSJmb250LXN0eWxlOm5vcm1hbDtmb250LXZhcmlhbnQ6bm9ybWFsO2ZvbnQtd2VpZ2h0Om5vcm1hbDtmb250LXN0cmV0Y2g6bm9ybWFsO2ZvbnQtc2l6ZTo0LjkzODg5cHg7Zm9udC1mYW1pbHk6QXJpYWw7LWlua3NjYXBlLWZvbnQtc3BlY2lmaWNhdGlvbjpBcmlhbDt0ZXh0LWFsaWduOmNlbnRlcjt0ZXh0LWFuY2hvcjptaWRkbGU7ZmlsbDojZmZmZmZmO3N0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIgogICAgICAgICBpZD0idHNwYW4xOC0zIj7RgNCw0LHQvtGC0LAg0L3QsCDQu9C40L3QuNC4PC90c3Bhbj48L3RleHQ+CiAgPC9nPgo8L3N2Zz4K',
      },
      {
        key: 'grounded',
        title: 'Заземлено',
        priority: 2,
        src: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjIwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCA1Mi45MTY2NjUgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJncm91bmRlZC5zdmciCiAgIGlua3NjYXBlOnZlcnNpb249IjEuMC4yLTIgKGU4NmM4NzA4NzksIDIwMjEtMDEtMTUpIj4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgb2JqZWN0dG9sZXJhbmNlPSIxMCIKICAgICBncmlkdG9sZXJhbmNlPSIxMCIKICAgICBndWlkZXRvbGVyYW5jZT0iMTAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwMSIKICAgICBpZD0ibmFtZWR2aWV3OSIKICAgICBzaG93Z3JpZD0iZmFsc2UiCiAgICAgaW5rc2NhcGU6em9vbT0iMy4wMzc1IgogICAgIGlua3NjYXBlOmN4PSIzOC44NzI1NyIKICAgICBpbmtzY2FwZTpjeT0iNS42MTU3MzQiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9Ii05IgogICAgIGlua3NjYXBlOndpbmRvdy15PSItOSIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9ImxheWVyMSIKICAgICBpbmtzY2FwZTpkb2N1bWVudC1yb3RhdGlvbj0iMCIgLz4KICA8ZGVmcwogICAgIGlkPSJkZWZzMiIgLz4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGE1Ij4KICAgIDxyZGY6UkRGPgogICAgICA8Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+CiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CiAgICAgICAgPGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPgogICAgICAgIDxkYzp0aXRsZSAvPgogICAgICA8L2NjOldvcms+CiAgICA8L3JkZjpSREY+CiAgPC9tZXRhZGF0YT4KICA8ZwogICAgIGlkPSJsYXllcjEiCiAgICAgc3R5bGU9InN0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIgogICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMjY0NTgzMzIsMC4yNjQ1ODE1MykiPgogICAgPHJlY3QKICAgICAgIHN0eWxlPSJmaWxsOiMwMDU1ZDQ7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOiNmZmZmZmY7c3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgIGlkPSJyZWN0MTIiCiAgICAgICB3aWR0aD0iNTEuODU4MzM0IgogICAgICAgaGVpZ2h0PSIyNS40IgogICAgICAgeD0iMC4yNjQ1ODMzMiIKICAgICAgIHk9IjAuMjY0NTgzNSIgLz4KICAgIDx0ZXh0CiAgICAgICB4bWw6c3BhY2U9InByZXNlcnZlIgogICAgICAgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtd2VpZ2h0Om5vcm1hbDtmb250LXNpemU6OC40NjY2N3B4O2xpbmUtaGVpZ2h0OjEuMjU7Zm9udC1mYW1pbHk6c2Fucy1zZXJpZjtmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiCiAgICAgICB4PSI0LjI5ODIzODgiCiAgICAgICB5PSIxNS43OTM0MjQiCiAgICAgICBpZD0idGV4dDE2Ij48dHNwYW4KICAgICAgICAgeD0iNC4yOTgyMzg4IgogICAgICAgICB5PSIxNS43OTM0MjQiCiAgICAgICAgIHN0eWxlPSJmb250LXN0eWxlOm5vcm1hbDtmb250LXZhcmlhbnQ6bm9ybWFsO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zdHJldGNoOmNvbmRlbnNlZDtmb250LXNpemU6OC40NjY2N3B4O2ZvbnQtZmFtaWx5OkFyaWFsOy1pbmtzY2FwZS1mb250LXNwZWNpZmljYXRpb246J0FyaWFsIEJvbGQgQ29uZGVuc2VkJztmaWxsOiNmZmZmZmY7c3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiCiAgICAgICAgIGlkPSJ0c3BhbjE4Ij7Ql9CQ0JfQldCc0JvQldCd0J48L3RzcGFuPjwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo=',
      },
      {
        key: 'workUnderVoltage',
        title: 'Работа под напряжением. Повторно не включать!',
        priority: 3,
        src: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjIwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCA1Mi45MTY2NjUgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJkb250X3N3aXRjaF93b3JrX3VuZGVyX3ZvbHRhZ2Uuc3ZnIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIxLjAuMi0yIChlODZjODcwODc5LCAyMDIxLTAxLTE1KSI+CiAgPHNvZGlwb2RpOm5hbWVkdmlldwogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBib3JkZXJvcGFjaXR5PSIxIgogICAgIG9iamVjdHRvbGVyYW5jZT0iMTAiCiAgICAgZ3JpZHRvbGVyYW5jZT0iMTAiCiAgICAgZ3VpZGV0b2xlcmFuY2U9IjEwIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIgogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxOTIwIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwMDEiCiAgICAgaWQ9Im5hbWVkdmlldzkiCiAgICAgc2hvd2dyaWQ9InRydWUiCiAgICAgaW5rc2NhcGU6em9vbT0iMy4wMzc1IgogICAgIGlua3NjYXBlOmN4PSIxMjYuMjQzNjMiCiAgICAgaW5rc2NhcGU6Y3k9IjYzLjkyNDA2NSIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iLTkiCiAgICAgaW5rc2NhcGU6d2luZG93LXk9Ii05IgogICAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgICAgaW5rc2NhcGU6Y3VycmVudC1sYXllcj0ibGF5ZXIxIgogICAgIGlua3NjYXBlOmRvY3VtZW50LXJvdGF0aW9uPSIwIgogICAgIHNob3dndWlkZXM9ImZhbHNlIj4KICAgIDxpbmtzY2FwZTpncmlkCiAgICAgICB0eXBlPSJ4eWdyaWQiCiAgICAgICBpZD0iZ3JpZDgzMyIgLz4KICA8L3NvZGlwb2RpOm5hbWVkdmlldz4KICA8ZGVmcwogICAgIGlkPSJkZWZzMiIgLz4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGE1Ij4KICAgIDxyZGY6UkRGPgogICAgICA8Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+CiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CiAgICAgICAgPGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPgogICAgICAgIDxkYzp0aXRsZT48L2RjOnRpdGxlPgogICAgICA8L2NjOldvcms+CiAgICA8L3JkZjpSREY+CiAgPC9tZXRhZGF0YT4KICA8ZwogICAgIGlkPSJsYXllcjEiCiAgICAgc3R5bGU9InN0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIgogICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMjY0NTgzMzIsMC4yNjQ1ODE1MykiPgogICAgPHJlY3QKICAgICAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOiNmZmZmZmY7c3Ryb2tlLXdpZHRoOjEuMDU4MzMzMzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgIGlkPSJyZWN0MTIiCiAgICAgICB3aWR0aD0iNTEuODU4MzM0IgogICAgICAgaGVpZ2h0PSIyNS40IgogICAgICAgeD0iMC4yNjQ1ODMzMiIKICAgICAgIHk9IjAuMjY0NTgzNSIgLz4KICAgIDx0ZXh0CiAgICAgICB4bWw6c3BhY2U9InByZXNlcnZlIgogICAgICAgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtd2VpZ2h0Om5vcm1hbDtmb250LXNpemU6NS42NDQ0NHB4O2xpbmUtaGVpZ2h0OjEuMjU7Zm9udC1mYW1pbHk6c2Fucy1zZXJpZjtmaWxsOiNmZjAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiCiAgICAgICB4PSI0Ny4yMzMwMjEiCiAgICAgICB5PSI4Ljg4OTg4MyIKICAgICAgIGlkPSJ0ZXh0MTYiPjx0c3BhbgogICAgICAgICBzb2RpcG9kaTpyb2xlPSJsaW5lIgogICAgICAgICBpZD0idHNwYW4xNDU2IgogICAgICAgICB4PSIyNi4yNDEzODUiCiAgICAgICAgIHk9IjguODg5ODgzIgogICAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC12YXJpYW50Om5vcm1hbDtmb250LXdlaWdodDpib2xkO2ZvbnQtc3RyZXRjaDpjb25kZW5zZWQ7Zm9udC1zaXplOjUuNjQ0NDRweDtmb250LWZhbWlseTpBcmlhbDstaW5rc2NhcGUtZm9udC1zcGVjaWZpY2F0aW9uOidBcmlhbCBCb2xkIENvbmRlbnNlZCciPjx0c3BhbgogICAgICAgICAgIHg9IjI2LjI0MTM4NSIKICAgICAgICAgICB5PSI4Ljg4OTg4MyIKICAgICAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC12YXJpYW50Om5vcm1hbDtmb250LXdlaWdodDpib2xkO2ZvbnQtc3RyZXRjaDpjb25kZW5zZWQ7Zm9udC1zaXplOjUuNjQ0NDRweDtmb250LWZhbWlseTpBcmlhbDstaW5rc2NhcGUtZm9udC1zcGVjaWZpY2F0aW9uOidBcmlhbCBCb2xkIENvbmRlbnNlZCc7dGV4dC1hbGlnbjpjZW50ZXI7dGV4dC1hbmNob3I6bWlkZGxlO2ZpbGw6I2ZmMDAwMDtzdHJva2Utd2lkdGg6MS4wNTgzMztzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIKICAgICAgICAgICBpZD0idHNwYW4xOCI+0KDQkNCR0J7QotCQPC90c3Bhbj48L3RzcGFuPjwvdGV4dD4KICAgIDx0ZXh0CiAgICAgICB4bWw6c3BhY2U9InByZXNlcnZlIgogICAgICAgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtd2VpZ2h0Om5vcm1hbDtmb250LXNpemU6My44ODA1NnB4O2xpbmUtaGVpZ2h0OjEuMjU7Zm9udC1mYW1pbHk6c2Fucy1zZXJpZjtmaWxsOiNmZjAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiCiAgICAgICB4PSI0Ny4xMjg5MSIKICAgICAgIHk9IjIxLjE2NDAzOCIKICAgICAgIGlkPSJ0ZXh0MTYtNSI+PHRzcGFuCiAgICAgICAgIHg9IjI2LjEzNzI2NiIKICAgICAgICAgeT0iMjEuMTY0MDM4IgogICAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC12YXJpYW50Om5vcm1hbDtmb250LXdlaWdodDpib2xkO2ZvbnQtc3RyZXRjaDpjb25kZW5zZWQ7Zm9udC1zaXplOjMuODgwNTZweDtmb250LWZhbWlseTpBcmlhbDstaW5rc2NhcGUtZm9udC1zcGVjaWZpY2F0aW9uOidBcmlhbCBCb2xkIENvbmRlbnNlZCc7dGV4dC1hbGlnbjpjZW50ZXI7dGV4dC1hbmNob3I6bWlkZGxlO2ZpbGw6I2ZmMDAwMDtzdHJva2Utd2lkdGg6MS4wNTgzMztzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIKICAgICAgICAgaWQ9InRzcGFuMTgtMyI+0J/QntCS0KLQntCg0J3QniDQndCVINCS0JrQm9Cu0KfQkNCi0KwhPC90c3Bhbj48L3RleHQ+CiAgICA8cmVjdAogICAgICAgc3R5bGU9ImZpbGw6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6I2ZmMDAwMDtzdHJva2Utd2lkdGg6MS4zMjI5MjtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIgogICAgICAgaWQ9InJlY3QxMi04IgogICAgICAgd2lkdGg9IjUwLjUzNTQxNiIKICAgICAgIGhlaWdodD0iMjQuMDc3MDg0IgogICAgICAgeD0iMC45MjYwNDMzMyIKICAgICAgIHk9IjAuOTI2MDQ1MTIiIC8+CiAgICA8dGV4dAogICAgICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIKICAgICAgIHN0eWxlPSJmb250LXN0eWxlOm5vcm1hbDtmb250LXdlaWdodDpub3JtYWw7Zm9udC1zaXplOjQuOTM4ODlweDtsaW5lLWhlaWdodDoxLjI1O2ZvbnQtZmFtaWx5OnNhbnMtc2VyaWY7ZmlsbDojZmYwMDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIgogICAgICAgeD0iNDcuMjEwOTQ5IgogICAgICAgeT0iMTQuNjgzOTE2IgogICAgICAgaWQ9InRleHQxNi0zIj48dHNwYW4KICAgICAgICAgc29kaXBvZGk6cm9sZT0ibGluZSIKICAgICAgICAgaWQ9InRzcGFuMTQ1Ni05IgogICAgICAgICB4PSIyNi4yMTkzMTUiCiAgICAgICAgIHk9IjE0LjY4MzkxNiIKICAgICAgICAgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtdmFyaWFudDpub3JtYWw7Zm9udC13ZWlnaHQ6Ym9sZDtmb250LXN0cmV0Y2g6Y29uZGVuc2VkO2ZvbnQtc2l6ZTo0LjkzODg5cHg7Zm9udC1mYW1pbHk6QXJpYWw7LWlua3NjYXBlLWZvbnQtc3BlY2lmaWNhdGlvbjonQXJpYWwgQm9sZCBDb25kZW5zZWQnIj48dHNwYW4KICAgICAgICAgICB4PSIyNi4yMTkzMTUiCiAgICAgICAgICAgeT0iMTQuNjgzOTE2IgogICAgICAgICAgIHN0eWxlPSJmb250LXN0eWxlOm5vcm1hbDtmb250LXZhcmlhbnQ6bm9ybWFsO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zdHJldGNoOmNvbmRlbnNlZDtmb250LXNpemU6NC45Mzg4OXB4O2ZvbnQtZmFtaWx5OkFyaWFsOy1pbmtzY2FwZS1mb250LXNwZWNpZmljYXRpb246J0FyaWFsIEJvbGQgQ29uZGVuc2VkJzt0ZXh0LWFsaWduOmNlbnRlcjt0ZXh0LWFuY2hvcjptaWRkbGU7ZmlsbDojZmYwMDAwO3N0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIgogICAgICAgICAgIGlkPSJ0c3BhbjE4LTciPtCf0J7QlCDQndCQ0J/QoNCv0JbQldCd0JjQldCcLjwvdHNwYW4+PC90c3Bhbj48L3RleHQ+CiAgPC9nPgo8L3N2Zz4K',
      },
      {
        key: 'transit',
        title: 'Транзит разомкнут',
        priority: 4,
        src: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjIwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCA1Mi45MTY2NjUgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJ0cmFuc2l0LnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS4wLjItMiAoZTg2Yzg3MDg3OSwgMjAyMS0wMS0xNSkiPgogIDxzb2RpcG9kaTpuYW1lZHZpZXcKICAgICBwYWdlY29sb3I9IiNmZmZmZmYiCiAgICAgYm9yZGVyY29sb3I9IiM2NjY2NjYiCiAgICAgYm9yZGVyb3BhY2l0eT0iMSIKICAgICBvYmplY3R0b2xlcmFuY2U9IjEwIgogICAgIGdyaWR0b2xlcmFuY2U9IjEwIgogICAgIGd1aWRldG9sZXJhbmNlPSIxMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSIxMDAxIgogICAgIGlkPSJuYW1lZHZpZXc5IgogICAgIHNob3dncmlkPSJ0cnVlIgogICAgIGlua3NjYXBlOnpvb209IjMuMDM3NSIKICAgICBpbmtzY2FwZTpjeD0iMTE3Ljk2NDY1IgogICAgIGlua3NjYXBlOmN5PSI1OC4yOTA2MzEiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9Ii05IgogICAgIGlua3NjYXBlOndpbmRvdy15PSItOSIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9ImxheWVyMSIKICAgICBpbmtzY2FwZTpkb2N1bWVudC1yb3RhdGlvbj0iMCI+CiAgICA8aW5rc2NhcGU6Z3JpZAogICAgICAgdHlwZT0ieHlncmlkIgogICAgICAgaWQ9ImdyaWQyNzY4IiAvPgogIDwvc29kaXBvZGk6bmFtZWR2aWV3PgogIDxkZWZzCiAgICAgaWQ9ImRlZnMyIiAvPgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTUiPgogICAgPHJkZjpSREY+CiAgICAgIDxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj4KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4KICAgICAgICA8ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+CiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+CiAgICAgIDwvY2M6V29yaz4KICAgIDwvcmRmOlJERj4KICA8L21ldGFkYXRhPgogIDxnCiAgICAgaWQ9ImxheWVyMSIKICAgICBzdHlsZT0ic3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiCiAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4yNjQ1ODMzMiwwLjI2NDU4MTUzKSI+CiAgICA8cmVjdAogICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6IzAwMDBmZjtzdHJva2Utd2lkdGg6Mi4xMTY2NjY2NjtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIgogICAgICAgaWQ9InJlY3QxMiIKICAgICAgIHdpZHRoPSI1MS44NTgzMzQiCiAgICAgICBoZWlnaHQ9IjI1LjQiCiAgICAgICB4PSIwLjI2NDU4MzMyIgogICAgICAgeT0iMC4yNjQ1ODM1IiAvPgogICAgPHRleHQKICAgICAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC13ZWlnaHQ6bm9ybWFsO2ZvbnQtc2l6ZTo3Ljc2MTExcHg7bGluZS1oZWlnaHQ6MS4yNTtmb250LWZhbWlseTpzYW5zLXNlcmlmO3RleHQtYWxpZ246Y2VudGVyO3RleHQtYW5jaG9yOm1pZGRsZTtmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiCiAgICAgICB4PSIzOC41NjcxMzUiCiAgICAgICB5PSIxMC4xMzE1NTgiCiAgICAgICBpZD0idGV4dDE2Ij48dHNwYW4KICAgICAgICAgeD0iMjUuOTg3NTM5IgogICAgICAgICB5PSIxMC4xMzE1NTgiCiAgICAgICAgIHN0eWxlPSJmb250LXN0eWxlOm5vcm1hbDtmb250LXZhcmlhbnQ6bm9ybWFsO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zdHJldGNoOmNvbmRlbnNlZDtmb250LXNpemU6Ny43NjExMXB4O2ZvbnQtZmFtaWx5OkFyaWFsOy1pbmtzY2FwZS1mb250LXNwZWNpZmljYXRpb246J0FyaWFsIEJvbGQgQ29uZGVuc2VkJzt0ZXh0LWFsaWduOmNlbnRlcjt0ZXh0LWFuY2hvcjptaWRkbGU7ZmlsbDojMDAwMDAwO3N0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIgogICAgICAgICBpZD0idHNwYW4xOCI+0KLRgNCw0L3Qt9C40YI8L3RzcGFuPjwvdGV4dD4KICAgIDx0ZXh0CiAgICAgICB4bWw6c3BhY2U9InByZXNlcnZlIgogICAgICAgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtd2VpZ2h0Om5vcm1hbDtmb250LXNpemU6Ny43NjExMXB4O2xpbmUtaGVpZ2h0OjEuMjU7Zm9udC1mYW1pbHk6c2Fucy1zZXJpZjt0ZXh0LWFsaWduOmNlbnRlcjt0ZXh0LWFuY2hvcjptaWRkbGU7ZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIgogICAgICAgeD0iNDIuMzE2NjIiCiAgICAgICB5PSIxOS40NjgxODkiCiAgICAgICBpZD0idGV4dDE2LTMiPjx0c3BhbgogICAgICAgICB4PSIyNi4xMjM2NDIiCiAgICAgICAgIHk9IjE5LjQ2ODE4OSIKICAgICAgICAgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtdmFyaWFudDpub3JtYWw7Zm9udC13ZWlnaHQ6Ym9sZDtmb250LXN0cmV0Y2g6Y29uZGVuc2VkO2ZvbnQtc2l6ZTo3Ljc2MTExcHg7Zm9udC1mYW1pbHk6QXJpYWw7LWlua3NjYXBlLWZvbnQtc3BlY2lmaWNhdGlvbjonQXJpYWwgQm9sZCBDb25kZW5zZWQnO3RleHQtYWxpZ246Y2VudGVyO3RleHQtYW5jaG9yOm1pZGRsZTtmaWxsOiMwMDAwMDA7c3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiCiAgICAgICAgIGlkPSJ0c3BhbjE4LTAiPtGA0LDQt9C+0LzQutC90YPRgjwvdHNwYW4+PC90ZXh0PgogIDwvZz4KPC9zdmc+Cg==',
      },
    ],
    /**
     *
     * @param {*} key - poster key
     * @param {*} src - poster image src
     * @param {*} title - poster title
     * @returns webix config for carousel view
     */
    getCarouselView(key, src, title) {
      return {
        css: 'image',
        id: key,
        template: `<div class="poster-carousel-title">${title}</div><img src="${src}" class="poster-carousel-content" ondragstart="return false"/>`,
      };
    },
    /**
     *
     */
    emptyCarouselView: {
      css: 'poster-carousel-empty',
      id: 'carousel_empty_view',
      template: '<span>нет вывешенных плакатов</span>',
    },
    /**
     *
     * @param {*} carouselId
     * @param {*} settedPosterKeys
     */
    getPosterPriority(key) {
      for (let meta of this.metadata) {
        if (meta.key === key) {
          return meta.priority;
        }
      }
      return -1;
    },
    /**
     *
     * @param {string} carouselId - id of webix carousel component
     * @param {string} settedPosterKeys - keys string with dash delimeter
     */
    updateCarousel(carouselId, settedPosterKeys) {
      const carousel = $$(carouselId);
      const getViewConfigs = () =>
        carousel
          .getChildViews()[0]
          .getChildViews()
          .map((view) => view.config);

      const viewConfigs = getViewConfigs();
      /* add empty view if we don't have setted posters  */
      if (settedPosterKeys.length === 0 && (viewConfigs.length === 0 || viewConfigs[0].id !== this.emptyCarouselView.id)) {
        carousel.addView(this.emptyCarouselView);
      }
      this.metadata.forEach((poster) => {
        const isSetted = settedPosterKeys.includes(poster.key);
        const _viewConfigs = getViewConfigs();
        const isInCarousel = (key) => _viewConfigs.findIndex((view) => view.id === key) !== -1;

        if (isSetted && !isInCarousel(poster.key)) {
          /* poster is setted but doesn't present in caruosel */
          carousel.addView(this.getCarouselView(poster.key, poster.src, poster.title));
        } else if (!isSetted && isInCarousel(poster.key)) {
          /* poster is not setted but presents in caruosel */
          carousel.removeView(poster.key);
        }
      });
      /* remove empty view if we have setted posters  */
      if (settedPosterKeys.length > 0) {
        carousel.removeView(this.emptyCarouselView.id);
      }
    },
    /**
     *
     *
     */
    createPosterPropertiesWindow(poster, graph, cell, isReadonly, isNewPoster, schemeName) {
      if (!poster) {
        console.log('Не удалось получить информацию о плакате')
        // messageError('Не удалось получить информацию о плакате');
        return null;
      }

      const id = 'poster_' + (isNewPoster ? 'new' : poster.id);

      if ($$(id)) {
        return null;
      }

      const carouselId = id + '_carousel';
      const tableId = id + '_table';
      const formId = id + '_form';

      const escHandler = () => {
        if ($$(id) && $$(id).isVisible()) {
          $$(id).hide();
        }
      };

      const posterTable = {
        view: 'datatable',
        id: tableId,
        columns: [
          {
            id: 'title',
            fillspace: true,
            header: 'Наименование',
          },
          {
            id: 'isSetted',
            header: 'Установлен',
            width: 96,
            template: '{common.checkbox()}',
          },
        ],
        drag: false,
        data: [],
        header: false,
        height: 72,
        hidden: isReadonly,
        rowHeight: 24,
        scroll: 'y',
        on: {
          onCheck: (row, column, state) => {
            const settedKeys = [];
            /* walk in table data array */
            $$(tableId)
              .serialize()
              .forEach((item) => {
                if (item.isSetted) {
                  settedKeys.push(item.key);
                }
              });
            this.updateCarousel(carouselId, settedKeys);
          },
        },
      };

      const posterForm = [
        {
          view: 'text',
          name: 'schemeName',
          borderless: true,
          css: 'form-text-readonly',
          hidden: !schemeName,
          label: 'Схема:',
          labelPosition: 'left',
          margin: { top: 0 },
          readonly: true,
        },
        {
          view: 'text',
          name: 'created',
          borderless: true,
          css: 'form-text-readonly',
          hidden: isNewPoster,
          label: 'Создан:',
          labelPosition: 'left',
          margin: { top: 0 },
          readonly: true,
        },
        {
          view: 'text',
          name: 'modified',
          borderless: true,
          css: 'form-text-readonly',
          hidden: isNewPoster,
          label: poster.isRemoved ? 'Удален:' : 'Изменен:',
          labelPosition: 'left',
          margin: { top: 0 },
          readonly: true,
        },
        {
          view: 'label',
          css: 'form-mark-select-label',
          label: 'Плакаты',
          hidden: isReadonly,
        },
        posterTable,
        {
          view: 'text',
          name: 'label',
          label: 'Заголовок',
          labelPosition: 'top',
          readonly: isReadonly,
          invalidMessage: 'Не должно быть пустым. Максимальная длина 64 символа.',
          validate: webix.rules.stringLength(1, 64),
        },
        {
          view: 'textarea',
          name: 'text',
          minHeight: 144,
          label: 'Сообщение',
          labelPosition: 'top',
          readonly: isReadonly,
          invalidMessage: 'Максимальная длина 512 символов.',
          validate: webix.rules.maxLength(512),
        },
      ];

      const viewerActions = {
        padding: { top: 8, bottom: 8 },
        cols: [
          {}, // spacer
          {
            align: 'left',
            view: 'button',
            type: 'form',
            label: 'Перейти',
            align: 'right',
            css: 'webix_primary',
            width: 104,
            inputWidth: 96,
            height: 40,
            hidden: poster.isRemoved || !!cell, // hide button if poster is removed or opened in viewer
            click: function () {
              const url = HELP.buildUrl('scheme/view', 'id=' + poster.schemeId + '&poster=' + poster.id);
              HELP.pageRedirect(url);
            },
          },
          {
            view: 'button',
            label: 'common.close',
            align: 'right',
            width: 104,
            inputWidth: 96,
            height: 40,
            click: function () {
              this.getTopParentView().close();
            },
          },
          {}, // spacer
        ],
      };

      const editorActions = {
        padding: { top: 8, bottom: 8 },
        cols: [
          {}, // spacer
          {
            align: 'left',
            view: 'button',
            type: 'form',
            label: 'common.save',
            align: 'right',
            css: 'webix_primary',
            width: 104,
            inputWidth: 96,
            height: 40,
            click: function () {
              const posterWindow = this.getTopParentView();
              /* get poster type */
              const settedPosters = $$(tableId)
                .serialize()
                .filter((item) => item.isSetted);
              let typeString = '';
              settedPosters.forEach((_poster) => {
                typeString += _poster.key + '-';
              });
              if (typeString.length > 0) {
                typeString = typeString.slice(0, -1);
              }
              /* get form data */
              if (!$$(formId).validate()) {
                return;
              }
              const formData = $$(formId).getValues();
              /* set poster model */
              poster.data = {
                type: typeString,
                title: formData.label,
                message: formData.text,
                x: cell.geometry.x,
                y: cell.geometry.y,
                width: cell.geometry.width,
                height: cell.geometry.height,
              };

              /* update cell */
              //--->fix---//
              let viewer = null
              //--->fix---//
              const marksService = viewer.marksService; // TODO ref global variable
              /* update cell graphics */
              graph.cellRenderer.redrawShape(graph.view.getState(cell), true);
              /* add cell to temp list */
              if (marksService.isEnabled() && !marksService.insertedCells.has(poster.id)) {
                marksService.editedCells.set(poster.id, cell);
                marksService.setSnackbarTitle();
              }
              /* poster markup update */
              const editorUi = window.viewer;
              const bindingsHandler = new BindingsHandler(editorUi);

              // init bindings
              if (typeof BindingsHandler == 'function') {
                bindingsHandler.graph.view.validatePosterState(cell);
              }
              marksService.updatePosterLayer();
              /* close window */
              posterWindow.close();
            },
          },
          {
            view: 'button',
            label: 'common.cancel',
            align: 'right',
            width: 104,
            inputWidth: 96,
            height: 40,
            click: function () {
              this.getTopParentView().close();
            },
          },
          {}, // spacer
        ],
      };

      const posterWindow = webix.ui({
        view: 'window',
        id: id,
        close: true,
        head: isNewPoster ? ' Добавить плакат' : isReadonly ? 'Просмотр плаката' : 'Редактировать плакат',
        minHeight: isReadonly ? 512 : 640,
        minWidth: 512,
        modal: true,
        move: true,
        resize: true,
        body: {
          rows: [
            {
              view: 'carousel',
              id: carouselId,
              cols: [],
              minHeight: 160,
              navigation: {
                type: 'side',
              },
            },
            {
              view: 'form',
              id: formId,
              paddingY: isReadonly ? 8 : 4,
              elements: posterForm,
              scroll: false,
            },
            isReadonly ? viewerActions : editorActions,
          ],
        },
      });

      const updateView = () => {
        const recievedKeys = poster.data.type.split('-') || [];
        const settedKeys = this.metadata.reduce((filtered, meta) => {
          if (recievedKeys.includes(meta.key)) {
            filtered.push(meta.key);
          }
          return filtered;
        }, []);

        /* update carousel */
        this.updateCarousel(carouselId, settedKeys);
        /* update table */
        if (!isReadonly) {
          const tableData = this.metadata.map((meta) => {
            return {
              key: meta.key,
              title: meta.title,
              isSetted: settedKeys.includes(meta.key),
            };
          });
          $$(tableId).define('data', tableData);
          $$(tableId).refresh();
        }
        /* update form */
        $$(formId).setValues({
          schemeName,
          created: `${API.FORMAT.getRawTimestamp(poster.createdAt).slice(0, -4)}, ${poster.createdBy}`,
          modified: `${API.FORMAT.getRawTimestamp(poster.ts).slice(0, -4)}, ${poster.modifiedBy}`,
          label: poster.data.title,
          text: poster.data.message,
        });
      };

      posterWindow.attachEvent('onBeforeShow', function () {
        webix.UIManager.addHotKey('escape', escHandler);
        updateView();
      });

      posterWindow.attachEvent('onHide', function () {
        webix.UIManager.removeHotKey('escape', escHandler);
        posterWindow.close();
        posterWindow.destructor();
      });

      return posterWindow;
    },
    getWindowPostionByCell(cellState, posterWindow) {
      const nodeClientBounds = cellState.shape.node.getBoundingClientRect();
      return {
        x: nodeClientBounds.x <= window.innerWidth / 2 ? nodeClientBounds.width + 24 : -(posterWindow.config.minWidth + 24),
        y: 10,
      };
    },
    openPosterViewer(poster, graph, cell, schemeName) {
      const posterViewer = this.createPosterPropertiesWindow(poster, graph, cell, true, false, schemeName);
      if (!posterViewer) {
        return;
      }
      const cellState = graph && cell ? graph.view.getState(cell) : null;
      if (cellState) {
        /* open nearby cell */
        posterViewer.show(cellState.shape.node, this.getWindowPostionByCell(cellState, posterViewer));
      } else {
        /* centered */
        posterViewer.show();
      }
    },
    openPosterEditor(graph, cell, isNewPoster) {
      const posterEditor = this.createPosterPropertiesWindow(cell._model, graph, cell, false, isNewPoster);
      if (!posterEditor) {
        return;
      }
      const cellState = graph && cell ? graph.view.getState(cell) : null;
      if (cellState) {
        /* open nearby cell */
        posterEditor.show(cellState.shape.node, this.getWindowPostionByCell(cellState, posterEditor));
      } else {
        /* centered */
        posterEditor.show();
      }
    },
    getEventSting(posterArgs) {
      let eventSting = '';
      if (!posterArgs.type && posterArgs.type !== '') {
        return eventSting;
      }
      const recievedKeys = posterArgs.type.split('-');
      const settedTypes = this.metadata.reduce((filtered, meta) => {
        if (recievedKeys.includes(meta.key)) {
          filtered.push(meta.title);
        }
        return filtered;
      }, []);

      if (settedTypes.length > 1) {
        eventSting = `<b>Плакаты:</b> "${settedTypes.join('", "')}". <b>Схема:</b> "${posterArgs.schemeName}".`;
      } else if (settedTypes.length === 1) {
        eventSting = `<b>Плакат:</b> "${settedTypes[0]}". <b>Схема:</b> "${posterArgs.schemeName}".`;
      } else {
        eventSting = `<b>Схема:</b> "${posterArgs.schemeName}".`;
      }
      return eventSting;
    },
  };

  API.DISPATCHER_MARKS = {
    metadata: [
      {
        key: 'info',
        title: 'Комментарий',
        src: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjEwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCAyNi40NTgzMzMgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJpbmZvLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS4wLjItMiAoZTg2Yzg3MDg3OSwgMjAyMS0wMS0xNSkiPgogIDxzb2RpcG9kaTpuYW1lZHZpZXcKICAgICBwYWdlY29sb3I9IiNmZmZmZmYiCiAgICAgYm9yZGVyY29sb3I9IiM2NjY2NjYiCiAgICAgYm9yZGVyb3BhY2l0eT0iMSIKICAgICBvYmplY3R0b2xlcmFuY2U9IjEwIgogICAgIGdyaWR0b2xlcmFuY2U9IjEwMDAwIgogICAgIGd1aWRldG9sZXJhbmNlPSIxMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSIxMDAxIgogICAgIGlkPSJuYW1lZHZpZXc5IgogICAgIHNob3dncmlkPSJ0cnVlIgogICAgIGlua3NjYXBlOnpvb209IjQuNDI3NDY3MyIKICAgICBpbmtzY2FwZTpjeD0iMTUuNzI1NjEzIgogICAgIGlua3NjYXBlOmN5PSI2Mi4xMjE2NTYiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9Ii05IgogICAgIGlua3NjYXBlOndpbmRvdy15PSItOSIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9ImxheWVyMSIKICAgICBpbmtzY2FwZTpkb2N1bWVudC1yb3RhdGlvbj0iMCIKICAgICBpbmtzY2FwZTpzbmFwLWdsb2JhbD0idHJ1ZSI+CiAgICA8aW5rc2NhcGU6Z3JpZAogICAgICAgdHlwZT0ieHlncmlkIgogICAgICAgaWQ9ImdyaWQ4MzMiCiAgICAgICBzcGFjaW5neD0iMC4yNjQ1ODMzMyIKICAgICAgIHNwYWNpbmd5PSIwLjI2NDU4MzMzIgogICAgICAgZW1wc3BhY2luZz0iMTAiIC8+CiAgPC9zb2RpcG9kaTpuYW1lZHZpZXc+CiAgPGRlZnMKICAgICBpZD0iZGVmczIiIC8+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhNSI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGUgLz4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGcKICAgICBpZD0ibGF5ZXIxIgogICAgIHN0eWxlPSJzdHJva2Utd2lkdGg6MS4wNTgzMztzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjI2NDU4MzMyLDAuMjY0NTgxNTMpIj4KICAgIDx0ZXh0CiAgICAgICB4bWw6c3BhY2U9InByZXNlcnZlIgogICAgICAgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtd2VpZ2h0Om5vcm1hbDtmb250LXNpemU6MjIuNTc3OHB4O2xpbmUtaGVpZ2h0OjEuMjU7Zm9udC1mYW1pbHk6c2Fucy1zZXJpZjtmaWxsOiNlNjQ2ZTY7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjAuMjgwMDE2IgogICAgICAgeD0iOS43MDQ5MDE3IgogICAgICAgeT0iMjAuODY5MDM0IgogICAgICAgaWQ9InRleHQ4NTEiPjx0c3BhbgogICAgICAgICBzb2RpcG9kaTpyb2xlPSJsaW5lIgogICAgICAgICBpZD0idHNwYW44NDkiCiAgICAgICAgIHg9IjkuNzA0OTAxNyIKICAgICAgICAgeT0iMjAuODY5MDM0IgogICAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC12YXJpYW50Om5vcm1hbDtmb250LXdlaWdodDpib2xkO2ZvbnQtc3RyZXRjaDpub3JtYWw7Zm9udC1zaXplOjIyLjU3NzhweDtmb250LWZhbWlseTonVGltZXMgTmV3IFJvbWFuJzstaW5rc2NhcGUtZm9udC1zcGVjaWZpY2F0aW9uOidUaW1lcyBOZXcgUm9tYW4sIEJvbGQnO2ZpbGw6I2U2NDZlNjtmaWxsLW9wYWNpdHk6MTtzdHJva2Utd2lkdGg6MC4yODAwMTYiPmk8L3RzcGFuPjwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo=',
      },
      {
        key: 'fault',
        title: 'Повреждение',
        src: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjEwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCAyNi40NTgzMzMgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJmYXVsdC5zdmciCiAgIGlua3NjYXBlOnZlcnNpb249IjEuMC4yLTIgKGU4NmM4NzA4NzksIDIwMjEtMDEtMTUpIj4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgb2JqZWN0dG9sZXJhbmNlPSIxMCIKICAgICBncmlkdG9sZXJhbmNlPSIxMDAwMCIKICAgICBndWlkZXRvbGVyYW5jZT0iMTAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwMSIKICAgICBpZD0ibmFtZWR2aWV3OSIKICAgICBzaG93Z3JpZD0idHJ1ZSIKICAgICBpbmtzY2FwZTp6b29tPSIxLjYyMDYzODQiCiAgICAgaW5rc2NhcGU6Y3g9Ii0xMjEuMzYwNTUiCiAgICAgaW5rc2NhcGU6Y3k9IjUxLjExMjkxMiIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iLTkiCiAgICAgaW5rc2NhcGU6d2luZG93LXk9Ii05IgogICAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgICAgaW5rc2NhcGU6Y3VycmVudC1sYXllcj0ibGF5ZXIxIgogICAgIGlua3NjYXBlOmRvY3VtZW50LXJvdGF0aW9uPSIwIgogICAgIGlua3NjYXBlOnNuYXAtZ2xvYmFsPSJ0cnVlIj4KICAgIDxpbmtzY2FwZTpncmlkCiAgICAgICB0eXBlPSJ4eWdyaWQiCiAgICAgICBpZD0iZ3JpZDgzMyIKICAgICAgIHNwYWNpbmd4PSIwLjI2NDU4MzMzIgogICAgICAgc3BhY2luZ3k9IjAuMjY0NTgzMzMiCiAgICAgICBlbXBzcGFjaW5nPSIxMCIgLz4KICA8L3NvZGlwb2RpOm5hbWVkdmlldz4KICA8ZGVmcwogICAgIGlkPSJkZWZzMiIgLz4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGE1Ij4KICAgIDxyZGY6UkRGPgogICAgICA8Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+CiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CiAgICAgICAgPGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPgogICAgICAgIDxkYzp0aXRsZT48L2RjOnRpdGxlPgogICAgICA8L2NjOldvcms+CiAgICA8L3JkZjpSREY+CiAgPC9tZXRhZGF0YT4KICA8ZwogICAgIGlkPSJsYXllcjEiCiAgICAgc3R5bGU9InN0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIgogICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMjY0NTgzMzIsMC4yNjQ1ODE1MykiPgogICAgPHBhdGgKICAgICAgIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlOiNlNjQ2ZTY7c3Ryb2tlLXdpZHRoOjIuMTE2Njc7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgIGQ9Ik0gMTUuMDgxMjUsMS4wNTgzMzUxIDcuNjcyOTE2NSwxMS4zNzcwODUgSCAxOC4yNTYyNSBsIC03LjkzNzUsMTAuNTgzMzMzIgogICAgICAgaWQ9InBhdGg4MzUiCiAgICAgICBzb2RpcG9kaTpub2RldHlwZXM9ImNjY2MiIC8+CiAgICA8cGF0aAogICAgICAgc3R5bGU9ImZpbGw6I2U2NDZlNjtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4yNjQ1ODM7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgIGQ9Im0gOC45OTU4MzMsMjAuNjM3NTAxIDIuOTEwNDE3LDIuMTE2NjY3IC0zLjE3NTAwMDEsMS4zMjI5MTcgeiIKICAgICAgIGlkPSJwYXRoODQxIgogICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJjY2NjIiAvPgogIDwvZz4KPC9zdmc+Cg==',
      },
      {
        key: 'lineWork',
        title: 'Допуск к работе',
        src: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjEwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCAyNi40NTgzMzMgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJsaW5lV29yay5zdmciCiAgIGlua3NjYXBlOnZlcnNpb249IjEuMC4yLTIgKGU4NmM4NzA4NzksIDIwMjEtMDEtMTUpIj4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgb2JqZWN0dG9sZXJhbmNlPSIxMCIKICAgICBncmlkdG9sZXJhbmNlPSIxMCIKICAgICBndWlkZXRvbGVyYW5jZT0iMTAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9Ijk1OCIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSI5OTEiCiAgICAgaWQ9Im5hbWVkdmlldzkiCiAgICAgc2hvd2dyaWQ9InRydWUiCiAgICAgaW5rc2NhcGU6em9vbT0iMy4xODQwOTYzIgogICAgIGlua3NjYXBlOmN4PSI1NS44NDkzMzgiCiAgICAgaW5rc2NhcGU6Y3k9IjQ0LjgwMTI1NSIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iLTgiCiAgICAgaW5rc2NhcGU6d2luZG93LXk9IjAiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMCIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiCiAgICAgaW5rc2NhcGU6ZG9jdW1lbnQtcm90YXRpb249IjAiPgogICAgPGlua3NjYXBlOmdyaWQKICAgICAgIHR5cGU9Inh5Z3JpZCIKICAgICAgIGlkPSJncmlkODMzIiAvPgogIDwvc29kaXBvZGk6bmFtZWR2aWV3PgogIDxkZWZzCiAgICAgaWQ9ImRlZnMyIiAvPgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTUiPgogICAgPHJkZjpSREY+CiAgICAgIDxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj4KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4KICAgICAgICA8ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+CiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+CiAgICAgIDwvY2M6V29yaz4KICAgIDwvcmRmOlJERj4KICA8L21ldGFkYXRhPgogIDxnCiAgICAgaWQ9ImxheWVyMSIKICAgICBzdHlsZT0ic3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiCiAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4yNjQ1ODMzMiwwLjI2NDU4MTUzKSI+CiAgICA8cGF0aAogICAgICAgc3R5bGU9ImZpbGw6I2U2NDZlNjtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MDtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5lam9pbjptaXRlcjtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIgogICAgICAgZD0iTSAxLjU1MTE0ODEsMTMuODEwMDYzIDUuMjI3MzQ0NCwxMC4wMDM4NDMgMTkuNTAwNjcxLDIzLjc4OTU4MSAyMy4xNzY4NjgsMTkuOTgzMzYgOC45MDM1NDEzLDYuMTk3NjIyNSAxMC43NDE2NCw0LjI5NDUxMTggNy44ODY5NzQ0LDEuNTM3MzY0MyAwLjUzNDU4MDgxLDkuMTQ5ODA2IFoiCiAgICAgICBpZD0icGF0aDgzNSIKICAgICAgIHNvZGlwb2RpOm5vZGV0eXBlcz0iY2NjY2NjY2NjIiAvPgogICAgPHBhdGgKICAgICAgIGlkPSJwYXRoODM3IgogICAgICAgc3R5bGU9ImZpbGw6I2U2NDZlNjtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4yNjQ1ODM7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgIGQ9Ik0gMjAuMTE1OTI4LDEuODg0NTExNyAxNy4yNjAzMjQsNC42NDA2ODc1IDE3LjIyNzE4Miw2LjUxMTI4MDYgMy4zMjk5MTE5LDE5LjkyNDY2OSA3LjAwNDgxMywyMy43MzIxNCBsIDEzLjg5NzI3LC0xMy40MTMzODggMS44NzA1OTMsMC4wMzMxNCAyLjg1NTYwMywtMi43NTYxNzU0IHogTSAyMy43NTc2ODYsNy41NjI1NzYxIDIxLjg1Mzk1MSw5LjQwMDAyNjYgMTguMTc5MDUsNS41OTI1NTU0IDIwLjA4Mjc4NSwzLjc1NTEwNDkgWiIKICAgICAgIHNvZGlwb2RpOm5vZGV0eXBlcz0iY2NjY2NjY2NjY2NjY2MiIC8+CiAgPC9nPgo8L3N2Zz4K',
      },
      {
        key: 'lineWorkUnderVoltage',
        title: 'Допуск к работе под напряжением',
        src: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjEwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCAyNi40NTgzMzMgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJsaW5lV29ya1VuZGVyVm9sdGFnZS5zdmciCiAgIGlua3NjYXBlOnZlcnNpb249IjEuMC4yLTIgKGU4NmM4NzA4NzksIDIwMjEtMDEtMTUpIj4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgb2JqZWN0dG9sZXJhbmNlPSIxMCIKICAgICBncmlkdG9sZXJhbmNlPSIxMCIKICAgICBndWlkZXRvbGVyYW5jZT0iMTAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwMSIKICAgICBpZD0ibmFtZWR2aWV3OSIKICAgICBzaG93Z3JpZD0idHJ1ZSIKICAgICBpbmtzY2FwZTp6b29tPSI0Ljc0NTc3MjMiCiAgICAgaW5rc2NhcGU6Y3g9IjUzLjYzMDg5MyIKICAgICBpbmtzY2FwZTpjeT0iNTIuNDUyMDM5IgogICAgIGlua3NjYXBlOndpbmRvdy14PSItOSIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iLTkiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiCiAgICAgaW5rc2NhcGU6ZG9jdW1lbnQtcm90YXRpb249IjAiPgogICAgPGlua3NjYXBlOmdyaWQKICAgICAgIHR5cGU9Inh5Z3JpZCIKICAgICAgIGlkPSJncmlkODMzIiAvPgogIDwvc29kaXBvZGk6bmFtZWR2aWV3PgogIDxkZWZzCiAgICAgaWQ9ImRlZnMyIiAvPgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTUiPgogICAgPHJkZjpSREY+CiAgICAgIDxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj4KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4KICAgICAgICA8ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+CiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+CiAgICAgIDwvY2M6V29yaz4KICAgIDwvcmRmOlJERj4KICA8L21ldGFkYXRhPgogIDxnCiAgICAgaWQ9ImxheWVyMSIKICAgICBzdHlsZT0ic3Ryb2tlLXdpZHRoOjEuMDU4MzM7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiCiAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4yNjQ1ODMzMiwwLjI2NDU4MTUzKSI+CiAgICA8cGF0aAogICAgICAgc3R5bGU9ImZpbGw6I2ZmZmYwMDtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MDtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5lam9pbjptaXRlcjtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIgogICAgICAgZD0iTSAxLjU1MTE0ODEsMTMuODEwMDYzIDUuMjI3MzQ0NCwxMC4wMDM4NDMgMTkuNTAwNjcxLDIzLjc4OTU4MSAyMy4xNzY4NjgsMTkuOTgzMzYgOC45MDM1NDEzLDYuMTk3NjIyNSAxMC43NDE2NCw0LjI5NDUxMTggNy44ODY5NzQ0LDEuNTM3MzY0MyAwLjUzNDU4MDgxLDkuMTQ5ODA2IFoiCiAgICAgICBpZD0icGF0aDgzNSIKICAgICAgIHNvZGlwb2RpOm5vZGV0eXBlcz0iY2NjY2NjY2NjIiAvPgogICAgPHBhdGgKICAgICAgIGlkPSJwYXRoODM3IgogICAgICAgc3R5bGU9ImZpbGw6I2ZmZmYwMDtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4yNjQ1ODM7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgIGQ9Ik0gMjAuMTE1OTI4LDEuODg0NTExNyAxNy4yNjAzMjQsNC42NDA2ODc1IDE3LjIyNzE4Miw2LjUxMTI4MDYgMy4zMjk5MTE5LDE5LjkyNDY2OSA3LjAwNDgxMywyMy43MzIxNCBsIDEzLjg5NzI3LC0xMy40MTMzODggMS44NzA1OTMsMC4wMzMxNCAyLjg1NTYwMywtMi43NTYxNzU0IHogTSAyMy43NTc2ODYsNy41NjI1NzYxIDIxLjg1Mzk1MSw5LjQwMDAyNjYgMTguMTc5MDUsNS41OTI1NTU0IDIwLjA4Mjc4NSwzLjc1NTEwNDkgWiIKICAgICAgIHNvZGlwb2RpOm5vZGV0eXBlcz0iY2NjY2NjY2NjY2NjY2MiIC8+CiAgPC9nPgo8L3N2Zz4K',
      },
      {
        key: 'portableGrounding',
        title: 'Переносное заземление',
        src: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjEwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCAyNi40NTgzMzMgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJwb3J0YWJsZUdyb3VuZGluZy5zdmciCiAgIGlua3NjYXBlOnZlcnNpb249IjEuMC4yLTIgKGU4NmM4NzA4NzksIDIwMjEtMDEtMTUpIj4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgb2JqZWN0dG9sZXJhbmNlPSIxMCIKICAgICBncmlkdG9sZXJhbmNlPSIxMCIKICAgICBndWlkZXRvbGVyYW5jZT0iMTAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwMSIKICAgICBpZD0ibmFtZWR2aWV3OSIKICAgICBzaG93Z3JpZD0idHJ1ZSIKICAgICBpbmtzY2FwZTp6b29tPSI0Ljc0NTc3MjMiCiAgICAgaW5rc2NhcGU6Y3g9IjMzLjk3NjY0OSIKICAgICBpbmtzY2FwZTpjeT0iNTQuNDA1NDE1IgogICAgIGlua3NjYXBlOndpbmRvdy14PSItOSIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iLTkiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiCiAgICAgaW5rc2NhcGU6ZG9jdW1lbnQtcm90YXRpb249IjAiCiAgICAgaW5rc2NhcGU6c25hcC1nbG9iYWw9ImZhbHNlIj4KICAgIDxpbmtzY2FwZTpncmlkCiAgICAgICB0eXBlPSJ4eWdyaWQiCiAgICAgICBpZD0iZ3JpZDgzMyIgLz4KICA8L3NvZGlwb2RpOm5hbWVkdmlldz4KICA8ZGVmcwogICAgIGlkPSJkZWZzMiIgLz4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGE1Ij4KICAgIDxyZGY6UkRGPgogICAgICA8Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+CiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CiAgICAgICAgPGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPgogICAgICAgIDxkYzp0aXRsZT48L2RjOnRpdGxlPgogICAgICA8L2NjOldvcms+CiAgICA8L3JkZjpSREY+CiAgPC9tZXRhZGF0YT4KICA8ZwogICAgIGlkPSJsYXllcjEiCiAgICAgc3R5bGU9InN0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIgogICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMjY0NTgzMzIsMC4yNjQ1ODE1MykiPgogICAgPHBhdGgKICAgICAgIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlOiNmZmZmMDA7c3Ryb2tlLXdpZHRoOjIuMTE2Njc7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgIGQ9Ik0gMy43MDQxNjY3LDExLjY0MTY2OSAyMi4yMjUsMTEuNjQxNjY4IgogICAgICAgaWQ9InBhdGg4NTAiCiAgICAgICBzb2RpcG9kaTpub2RldHlwZXM9ImNjIiAvPgogICAgPHBhdGgKICAgICAgIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlOiNmZmZmMDA7c3Ryb2tlLXdpZHRoOjIuMTE2Njc7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgIGQ9Ik0gNi4zNTAwMDAxLDE1LjYxMDQxOCBIIDE5LjU3OTE2NyIKICAgICAgIGlkPSJwYXRoODUyIgogICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJjYyIgLz4KICAgIDxwYXRoCiAgICAgICBzdHlsZT0iZmlsbDpub25lO3N0cm9rZTojZmZmZjAwO3N0cm9rZS13aWR0aDoyLjExNjY3O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICBkPSJNIDguOTk1ODMzNCwxOS41NzkxNyBIIDE2LjkzMzMzMyIKICAgICAgIGlkPSJwYXRoODU0IgogICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJjYyIgLz4KICAgIDxwYXRoCiAgICAgICBzdHlsZT0iZmlsbDpub25lO3N0cm9rZTojZmZmZjAwO3N0cm9rZS13aWR0aDoyLjExNjY3O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICBkPSJNIDEyLjk2NDU4MywzLjcwNDE2ODUgViAxMS42NDE2NjgiCiAgICAgICBpZD0icGF0aDg1NiIKICAgICAgIHNvZGlwb2RpOm5vZGV0eXBlcz0iY2MiIC8+CiAgPC9nPgo8L3N2Zz4K',
      },
      {
        key: 'relayProtection',
        title: 'РЗА',
        src: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjEwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCAyNi40NTgzMzMgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJyemEuc3ZnIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIxLjAuMi0yIChlODZjODcwODc5LCAyMDIxLTAxLTE1KSI+CiAgPHNvZGlwb2RpOm5hbWVkdmlldwogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBib3JkZXJvcGFjaXR5PSIxIgogICAgIG9iamVjdHRvbGVyYW5jZT0iMTAiCiAgICAgZ3JpZHRvbGVyYW5jZT0iMTAwMDAiCiAgICAgZ3VpZGV0b2xlcmFuY2U9IjEwIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIgogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxOTIwIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwMDEiCiAgICAgaWQ9Im5hbWVkdmlldzkiCiAgICAgc2hvd2dyaWQ9InRydWUiCiAgICAgaW5rc2NhcGU6em9vbT0iMy4yNDEyNzY5IgogICAgIGlua3NjYXBlOmN4PSItMjYuNDg2MzEyIgogICAgIGlua3NjYXBlOmN5PSIzOC42NjI3NzMiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9Ii05IgogICAgIGlua3NjYXBlOndpbmRvdy15PSItOSIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9ImxheWVyMSIKICAgICBpbmtzY2FwZTpkb2N1bWVudC1yb3RhdGlvbj0iMCIKICAgICBpbmtzY2FwZTpzbmFwLWdsb2JhbD0idHJ1ZSI+CiAgICA8aW5rc2NhcGU6Z3JpZAogICAgICAgdHlwZT0ieHlncmlkIgogICAgICAgaWQ9ImdyaWQ4MzMiCiAgICAgICBzcGFjaW5neD0iMC4yNjQ1ODMzMyIKICAgICAgIHNwYWNpbmd5PSIwLjI2NDU4MzMzIgogICAgICAgZW1wc3BhY2luZz0iMTAiIC8+CiAgPC9zb2RpcG9kaTpuYW1lZHZpZXc+CiAgPGRlZnMKICAgICBpZD0iZGVmczIiIC8+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhNSI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGU+PC9kYzp0aXRsZT4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGcKICAgICBpZD0ibGF5ZXIxIgogICAgIHN0eWxlPSJzdHJva2Utd2lkdGg6MS4wNTgzMztzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjI2NDU4MzMyLDAuMjY0NTgxNTMpIj4KICAgIDx0ZXh0CiAgICAgICB4bWw6c3BhY2U9InByZXNlcnZlIgogICAgICAgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtd2VpZ2h0Om5vcm1hbDtmb250LXNpemU6MTQuMTExMXB4O2xpbmUtaGVpZ2h0OjEuMjU7Zm9udC1mYW1pbHk6c2Fucy1zZXJpZjtmaWxsOiNlNjQ2ZTY7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjAuMjgwMDE2IgogICAgICAgeD0iMS4xNjkxMTU5IgogICAgICAgeT0iMTcuOTk1NjAyIgogICAgICAgaWQ9InRleHQ4NTEiPjx0c3BhbgogICAgICAgICBzb2RpcG9kaTpyb2xlPSJsaW5lIgogICAgICAgICBpZD0idHNwYW44NDkiCiAgICAgICAgIHg9IjEuMTY5MTE1OSIKICAgICAgICAgeT0iMTcuOTk1NjAyIgogICAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC12YXJpYW50Om5vcm1hbDtmb250LXdlaWdodDpib2xkO2ZvbnQtc3RyZXRjaDpjb25kZW5zZWQ7Zm9udC1zaXplOjE0LjExMTFweDtmb250LWZhbWlseTpBcmlhbDstaW5rc2NhcGUtZm9udC1zcGVjaWZpY2F0aW9uOidBcmlhbCBCb2xkIENvbmRlbnNlZCc7ZmlsbDojZTY0NmU2O2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDowLjI4MDAxNiI+0KDQl9CQPC90c3Bhbj48L3RleHQ+CiAgPC9nPgo8L3N2Zz4K',
      },
      {
        key: 'busDisconnecting',
        title: 'Расшиновка',
        src: 'data:image/svg+xml;base64,PHN2ZzpzdmcgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIiB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHZpZXdCb3g9IjAgMCAyNi40NTgzMzMgMjYuNDU4MzM0IiB2ZXJzaW9uPSIxLjEiIGlkPSJzdmc4IiBzb2RpcG9kaTpkb2NuYW1lPSJidXNEaXNjb25uZWN0aW5nLnN2ZyIgaW5rc2NhcGU6dmVyc2lvbj0iMS4wLjItMiAoZTg2Yzg3MDg3OSwgMjAyMS0wMS0xNSkiPgogIDxzb2RpcG9kaTpuYW1lZHZpZXcgcGFnZWNvbG9yPSIjZmZmZmZmIiBib3JkZXJjb2xvcj0iIzY2NjY2NiIgYm9yZGVyb3BhY2l0eT0iMSIgb2JqZWN0dG9sZXJhbmNlPSIxMCIgZ3JpZHRvbGVyYW5jZT0iMTAiIGd1aWRldG9sZXJhbmNlPSIxMCIgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwMSIgaWQ9Im5hbWVkdmlldzkiIHNob3dncmlkPSJ0cnVlIiBpbmtzY2FwZTp6b29tPSIzLjM1NTc2NzgiIGlua3NjYXBlOmN4PSI0Ni43MTUwNzkiIGlua3NjYXBlOmN5PSI0MC43NzYzOTUiIGlua3NjYXBlOndpbmRvdy14PSItOSIgaW5rc2NhcGU6d2luZG93LXk9Ii05IiBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIiBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiIGlua3NjYXBlOmRvY3VtZW50LXJvdGF0aW9uPSIwIiBpbmtzY2FwZTpzbmFwLWdsb2JhbD0idHJ1ZSI+CiAgICA8aW5rc2NhcGU6Z3JpZCB0eXBlPSJ4eWdyaWQiIGlkPSJncmlkODMzIi8+CiAgPC9zb2RpcG9kaTpuYW1lZHZpZXc+CiAgPGRlZnMgaWQ9ImRlZnMyIi8+CiAgPG1ldGFkYXRhIGlkPSJtZXRhZGF0YTUiPgogICAgPHJkZjpSREY+CiAgICAgIDxjYzpXb3JrIHJkZjphYm91dD0iIj4KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4KICAgICAgICA8ZGM6dHlwZSByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIi8+CiAgICAgICAgPGRjOnRpdGxlLz4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGcgaWQ9ImxheWVyMSIgc3R5bGU9InN0cm9rZS13aWR0aDoxLjA1ODMzO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjI2NDU4MzMyLDAuMjY0NTgxNTMpIj4KICAgIDxjaXJjbGUgc3R5bGU9ImZpbGw6IzAwZmYwMDtzdHJva2Utd2lkdGg6MC40Mzk0MDM7ZmlsbC1vcGFjaXR5OjEiIGlkPSJwYXRoODM1IiBjeD0iMTIuOTY0NTg0IiBjeT0iMTIuOTY0NTg1IiByPSIxMy4yMjkxNjciLz4KICAgIDxwYXRoIHN0eWxlPSJmaWxsOm5vbmU7c3Ryb2tlOiNmZjAwMDA7c3Ryb2tlLXdpZHRoOjIuMTE2NjY2Njg7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW9wYWNpdHk6MTtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIgZD0iTSAzLjcwNDE2NjYsNS4wMjcwODUxIDIyLjIyNSwyMC45MDIwODUiIGlkPSJwYXRoODQxIi8+CiAgICA8cGF0aCBzdHlsZT0iZmlsbDpub25lO3N0cm9rZTojZmYwMDAwO3N0cm9rZS13aWR0aDoyLjExNjY2NjY4O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1vcGFjaXR5OjE7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmUiIGQ9Ik0gMjIuMjI1LDUuMDI3MDg1MSAzLjcwNDE2NjYsMjAuOTAyMDg1IiBpZD0icGF0aDg0MyIvPgogIDwvZz4KPC9zdmc6c3ZnPg==',
      },
      {
        key: 'numPortableGrounding',
        title: 'Переносное заземление (номерное)',
        src: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgd2lkdGg9IjEwMCIKICAgaGVpZ2h0PSIxMDAiCiAgIHZpZXdCb3g9IjAgMCAyNi40NTgzMzMgMjYuNDU4MzM0IgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmc4IgogICBzb2RpcG9kaTpkb2NuYW1lPSJwb3J0YWJsZUdyb3VuZGluZ051bWJlcmVkLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS4wLjItMiAoZTg2Yzg3MDg3OSwgMjAyMS0wMS0xNSkiPgogIDxzb2RpcG9kaTpuYW1lZHZpZXcKICAgICBwYWdlY29sb3I9IiNmZmZmZmYiCiAgICAgYm9yZGVyY29sb3I9IiM2NjY2NjYiCiAgICAgYm9yZGVyb3BhY2l0eT0iMSIKICAgICBvYmplY3R0b2xlcmFuY2U9IjEwIgogICAgIGdyaWR0b2xlcmFuY2U9IjEwIgogICAgIGd1aWRldG9sZXJhbmNlPSIxMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSIxMDAxIgogICAgIGlkPSJuYW1lZHZpZXc5IgogICAgIHNob3dncmlkPSJ0cnVlIgogICAgIGlua3NjYXBlOnpvb209IjQuNTgzODU3NyIKICAgICBpbmtzY2FwZTpjeD0iMzMuOTc2NjQ5IgogICAgIGlua3NjYXBlOmN5PSI1NC40MDU0MTUiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9Ii05IgogICAgIGlua3NjYXBlOndpbmRvdy15PSItOSIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9ImxheWVyMSIKICAgICBpbmtzY2FwZTpkb2N1bWVudC1yb3RhdGlvbj0iMCIKICAgICBpbmtzY2FwZTpzbmFwLWdsb2JhbD0idHJ1ZSI+CiAgICA8aW5rc2NhcGU6Z3JpZAogICAgICAgdHlwZT0ieHlncmlkIgogICAgICAgaWQ9ImdyaWQ4MzMiIC8+CiAgPC9zb2RpcG9kaTpuYW1lZHZpZXc+CiAgPGRlZnMKICAgICBpZD0iZGVmczIiIC8+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhNSI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGUgLz4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGcKICAgICBpZD0ibGF5ZXIxIgogICAgIHN0eWxlPSJzdHJva2Utd2lkdGg6MS4wNTgzMztzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjI2NDU4MzMyLDAuMjY0NTgxNTMpIj4KICAgIDxyZWN0CiAgICAgICBzdHlsZT0iZmlsbDojOTY4YzU1O3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDowO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO2ZpbGwtb3BhY2l0eToxIgogICAgICAgaWQ9InJlY3Q4MzgiCiAgICAgICB3aWR0aD0iMjYuNDU4MzMyIgogICAgICAgaGVpZ2h0PSIyNi40NTgzMzIiCiAgICAgICB4PSItMC4yNjQ1ODMzMiIKICAgICAgIHk9Ii0wLjI2NDU4MTUzIiAvPgogIDwvZz4KPC9zdmc+Cg==',
      },
    ],
    updateImage(meta, imgId) {
      $$(imgId).define('template', `<img src="${meta.src}" alt="${meta.title}">`);
      $$(imgId).refresh();
    },
    createMarkPropertiesWindow(dispatcherMark, graph, cell, isReadonly, isNewMark, schemeName) {
      if (!dispatcherMark) {
        console.log('Не удалось получить информацию о пометке')
        //messageError('Не удалось получить информацию о пометке');
        return null;
      }

      const id = 'dispatcherMark_' + (isNewMark ? 'new' : dispatcherMark.id);

      if ($$(id)) {
        return null;
      }

      const selectId = id + '_select';
      const formId = id + '_form';
      const imgId = id + '_img';

      const escHandler = () => {
        if ($$(id) && $$(id).isVisible()) {
          $$(id).hide();
        }
      };

      const markForm = [
        {
          view: 'text',
          name: 'schemeName',
          borderless: true,
          css: 'form-text-readonly',
          hidden: !schemeName,
          label: 'Схема:',
          labelPosition: 'left',
          margin: { top: 0 },
          readonly: true,
        },
        {
          view: 'text',
          name: 'created',
          borderless: true,
          css: 'form-text-readonly',
          hidden: isNewMark,
          label: 'Создана:',
          labelPosition: 'left',
          margin: { top: 0 },
          readonly: true,
        },
        {
          view: 'text',
          name: 'modified',
          borderless: true,
          css: 'form-text-readonly',
          hidden: isNewMark,
          label: dispatcherMark.isRemoved ? 'Удалена:' : 'Изменена:',
          labelPosition: 'left',
          margin: { top: 0 },
          readonly: true,
        },
        {
          view: 'label',
          css: 'form-mark-select-label',
          label: 'Тип отметки',
        },
        {
          css: {
            'margin-top': '0',
          },
          cols: [
            {
              view: 'select',
              id: selectId,
              name: 'type',
              disabled: isReadonly,
              on: {
                onChange: (newValue) => {
                  for (let meta of this.metadata) {
                    if (meta.key === newValue) {
                      this.updateImage(meta, imgId);
                      /* show or hide number input */
                      if (newValue === 'numPortableGrounding') {
                        $$(formId).showBatch('numberInput');
                      } else {
                        $$(formId).showBatch(''); // works as hide
                      }
                      return;
                    }
                  }
                },
              },
            },
            {
              id: imgId,
              css: 'form-mark-image',
              template: '<img alt="пометка">',
              width: 60,
            },
          ],
        },
        {
          view: 'text',
          name: 'title',
          label: 'Заголовок',
          labelPosition: 'top',
          readonly: isReadonly,
          invalidMessage: 'Не должно быть пустым. Максимальная длина 64 символа.',
          validate: webix.rules.stringLength(1, 64),
        },
        {
          view: 'text',
          name: 'number',
          batch: 'numberInput',
          label: 'Номер',
          labelPosition: 'top',
          readonly: isReadonly,
          invalidMessage: 'Максимальная длина 16 символов.',
          validate: webix.rules.maxLength(16),
        },
        {
          view: 'textarea',
          name: 'text',
          minHeight: 144,
          label: 'Сообщение',
          labelPosition: 'top',
          readonly: isReadonly,
          invalidMessage: 'Максимальная длина 512 символов.',
          validate: webix.rules.maxLength(512),
        },
      ];

      const viewerActions = {
        padding: { top: 8, bottom: 8 },
        cols: [
          {}, // spacer
          {
            align: 'left',
            view: 'button',
            type: 'form',
            label: 'Перейти',
            align: 'right',
            css: 'webix_primary',
            width: 104,
            inputWidth: 96,
            height: 40,
            hidden: dispatcherMark.isRemoved || !!cell, // hide button if dispatcher mark is removed or opened in viewer
            click: function () {
              const url = HELP.buildUrl('scheme/view', 'id=' + dispatcherMark.schemeId + '&mark=' + dispatcherMark.id);
              HELP.pageRedirect(url);
            },
          },
          {
            view: 'button',
            label: 'common.close',
            align: 'right',
            width: 104,
            inputWidth: 96,
            height: 40,
            click: function () {
              this.getTopParentView().close();
            },
          },
          {}, // spacer
        ],
      };

      const editorActions = {
        padding: { top: 8, bottom: 8 },
        cols: [
          {}, // spacer
          {
            align: 'left',
            view: 'button',
            type: 'form',
            label: 'common.save',
            align: 'right',
            css: 'webix_primary',
            width: 104,
            inputWidth: 96,
            height: 40,
            click: function () {
              /* get form data */
              if (!$$(formId).validate()) {
                return;
              }
              const formData = $$(formId).getValues();
              /* set mark model */
              dispatcherMark.data = {
                type: formData.type,
                title: formData.title,
                number: formData.number,
                message: formData.text,
                x: cell.geometry.x,
                y: cell.geometry.y,
                width: cell.geometry.width,
                height: cell.geometry.height,
              };
              /* update cell */
               //--->fix---//
               let viewer = null
               //--->fix---//
              const marksService = viewer.marksService; // TODO ref global variable
              /* update cell graphics */
              graph.cellRenderer.redrawShape(graph.view.getState(cell), true);
              /* add cell to temp list */
              if (marksService.isEnabled() && !marksService.insertedCells.has(dispatcherMark.id)) {
                marksService.editedCells.set(dispatcherMark.id, cell);
                marksService.setSnackbarTitle();
              }
              /* close window */
              this.getTopParentView().close();
            },
          },
          {
            view: 'button',
            label: 'common.cancel',
            align: 'right',
            width: 104,
            inputWidth: 96,
            height: 40,
            click: function () {
              this.getTopParentView().close();
            },
          },
          {}, // spacer
        ],
      };

      const markWindow = webix.ui({
        view: 'window',
        id: id,
        close: true,
        head: isNewMark ? ' Добавить пометку' : isReadonly ? 'Просмотр пометки' : 'Редактировать пометку',
        minHeight: isReadonly ? 512 : 560,
        minWidth: 512,
        modal: true,
        move: true,
        resize: true,
        body: {
          rows: [
            {
              view: 'form',
              id: formId,
              elements: markForm,
              paddingY: isReadonly ? 8 : 4,
              scroll: false,
            },
            isReadonly ? viewerActions : editorActions,
          ],
        },
      });

      const updateView = () => {
        const selectOptions = [];
        let type = this.metadata[0].key;
        this.metadata.forEach((meta) => {
          selectOptions.push({ value: meta.title, id: meta.key });
          if (dispatcherMark.type === meta.key) {
            type = meta.key;
            this.updateImage(meta);
          }
        });
        /* update selector */
        $$(selectId).define('options', selectOptions);
        $$(selectId).refresh();
        /* update form values */
        $$(formId).setValues({
          schemeName,
          created: `${API.FORMAT.getRawTimestamp(dispatcherMark.createdAt).slice(0, -4)}, ${dispatcherMark.createdBy}`,
          modified: `${API.FORMAT.getRawTimestamp(dispatcherMark.ts).slice(0, -4)}, ${dispatcherMark.modifiedBy}`,
          type: dispatcherMark.data.type,
          title: dispatcherMark.data.title,
          number: dispatcherMark.data.number || '',
          text: dispatcherMark.data.message,
        });
      };

      markWindow.attachEvent('onBeforeShow', function () {
        webix.UIManager.addHotKey('escape', escHandler);
        updateView();
      });

      markWindow.attachEvent('onHide', function () {
        webix.UIManager.removeHotKey('escape', escHandler);
        markWindow.close();
        markWindow.destructor();
      });

      return markWindow;
    },
    getWindowPostionByCell(cellState, markWindow) {
      const nodeClientBounds = cellState.shape.node.getBoundingClientRect();
      return {
        x: nodeClientBounds.x <= window.innerWidth / 2 ? nodeClientBounds.width + 24 : -(markWindow.config.minWidth + 24),
        y: 10,
      };
    },
    openMarkViewer(dispatcherMark, graph, cell, schemeName) {
      const markViewer = this.createMarkPropertiesWindow(dispatcherMark, graph, cell, true, false, schemeName);
      if (!markViewer) {
        return;
      }
      const cellState = graph && cell ? graph.view.getState(cell) : null;
      if (cellState) {
        /* open nearby cell */
        markViewer.show(cellState.shape.node, this.getWindowPostionByCell(cellState, markViewer));
      } else {
        /* centered */
        markViewer.show();
      }
    },
    openMarkEditor(graph, cell, isNewMark) {
      const markEditor = this.createMarkPropertiesWindow(cell._model, graph, cell, false, isNewMark);
      if (!markEditor) {
        return;
      }
      const cellState = graph && cell ? graph.view.getState(cell) : null;
      if (cellState) {
        /* open nearby cell */
        markEditor.show(cellState.shape.node, this.getWindowPostionByCell(cellState, markEditor));
      } else {
        /* centered */
        markEditor.show();
      }
    },
    getEventSting(markArgs) {
      let eventSting = '';
      const metadata = this.metadata.find((x) => x.key === markArgs.type);

      if (metadata) {
        eventSting = `<b>Пометка:</b> "${metadata.title}". <b>Схема:</b> "${markArgs.schemeName}".`;
      } else {
        eventSting = `<b>Схема:</b> "${markArgs.schemeName}".`;
      }
      return eventSting;
    },
  };

    API.HUBS = {
    // version from branch develop (after porting to NET6)

    setupHubConnection: function (hubName, setupFunction) {
      // console.log(`Setup "${hubName}" connection`);
      //const hubConnection = new signalR.HubConnectionBuilder().withUrl(location.origin + '/' + hubName).build();
      const hubConnection = new signalR.HubConnectionBuilder().withUrl(window.location.origin + '/' + hubName).build();
      if (typeof setupFunction === 'function') setupFunction(hubConnection);

      //----->fix<-------//
      // hubConnection
      //   .start()
      //   .then(() => {
      //     console.log(`"${hubName}" connection started`);
      //     if (typeof hubConnection.onHubConnectionSuccess === 'function') hubConnection.onHubConnectionSuccess();
      //   })
      //   .catch((e) => console.error(`Failed to start "${hubName}" connection`, e));
        //----->fix<-------//
    },

    // version from branch v4.3-demo-new (before porting to NET6)
    /*
        setupHubConnection: function (hubName, setup)
        {
            if ($.hubConnection)
            {
                var connection = $.hubConnection('/ws', { useDefaultPath: false });
                if (connection)
                {
                    var hubProxy = connection.createHubProxy(hubName);
                    hubProxy.onHubConnectionSuccess = function () { };
                    hubProxy.onHubConnectionError = function () { };

                    hubProxy.drop = webix.bind(function ()
                    {
                        this.dropping = true;
                        this.onHubConnectionSuccess = null;
                        this.onHubConnectionError = null;
                        if (this.connection !== null)
                        {
                            let noop = function () { };
                            this.connection.logging = false;
                            this.connection.error(noop);
                            this.connection.reconnecting(noop);
                            this.connection.reconnected(noop);
                            this.connection.disconnected(noop);
                            this.connection.stop();
                            this.connection = null;
                        }
                    }, hubProxy);

                    if (setup)
                        setup(hubProxy);

                    connection.logging = false;
                    var connectToHub = function ()
                    {
                        if (hubProxy.dropping || connection.state !== $.signalR.connectionState.disconnected)
                            return;

                        connection.start({ transport: ['webSockets', 'longPolling'], waitForPageLoad: false })
                            .done(function ()
                            {
                                HELP.log('Hub connected: ' + hubName + ', connection ID = ' + connection.id);
                                hubProxy.SuccessConnectionIsEstablished = true;
                                if (hubProxy.onHubConnectionSuccess)
                                    hubProxy.onHubConnectionSuccess();
                            })
                            .fail(function (err)
                            {
                                HELP.log('Hub start error: ' + hubName, err);
                                if (hubProxy.onHubConnectionError)
                                    hubProxy.onHubConnectionError();
                                setTimeout(connectToHub, 5000);
                            });
                    };

                    connection.error(function (err)
                    {
                        HELP.log('Hub connection error: ' + hubName, err);
                        if (hubProxy.dropping)
                            return;
                        if (hubProxy.onHubConnectionError)
                            hubProxy.onHubConnectionError();
                        setTimeout(connectToHub, 5000);
                    });
                    connection.reconnected(function ()
                    {
                        HELP.log('Hub reconnected: ' + hubName + ', connection ID = ' + connection.id);
                        if (hubProxy.dropping)
                            return;
                        if (hubProxy.onHubConnectionSuccess)
                            hubProxy.onHubConnectionSuccess();
                    });
                    connection.disconnected(function ()
                    {
                        HELP.log('Hub disconnected: ' + hubName);
                        if (hubProxy.dropping)
                            return;
                        if (hubProxy.onHubConnectionError)
                            hubProxy.onHubConnectionError();
                        setTimeout(connectToHub, 5000);
                    });

                    connectToHub();
                }
            }
        }
        */
  };

  API.DEMO = {
    demoView: function () {
      let context = this;
      this.isDemo = function () {
        try {
          //var si = webix.ajax().sync().get(API.FUNC.systemInfo);
          //obj = JSON.parse(si.responseText);
          //return obj.demo;
          
          // var id = webix.ajax().sync().get(API.FUNC.isDemo);
          // val = JSON.parse(id.responseText);
          
          //---->fix<------//
           let val = false
           //---->fix<------//

          return val;
        } finally {
        }
        return false;
      };
      this.getDemoRest = function () {
        try {
          // var dr = webix.ajax().sync().get(API.FUNC.demoRest);
          // val = JSON.parse(dr.responseText);

           //---->fix<------//
           let val = false
           //---->fix<------//

          return val;
        } finally {
        }
        return '?';
      };

      this.buildView = function () {
        var demorest = '?';
        var demo = this.isDemo();

                var dv = {
                    id: "demoheader",
                    css: 'demoheader',
                    autoheight: true,
                    hidden: !demo, // set false to see the demo-banner
                    rows: [
                        {
                            height: 10
                        },
                        {
                            cols: [
                                {
                                    rows:
                                        [
                                            {
                                                id: "demoinfo",
                                                borderless: true,
                                                autoheight: true,
                                                css: 'demo_template',
                                                template: "<p align='right'>Это демонстрационная версия продукта. До окончания пробного периода осталось дней:</p>"
                                                    + "<p align='right'>Информацию о полной версии можно получить в коммерческом департаменте: sales.mt@systeme.ru 8 (800) 250-63-60</p>"
                                            }
                                        ]
                                },
                                {
                                    id: "demorest",
                                    view: "template",
                                    css: 'demo_template',
                                    borderless: true,
                                    autoheight: true,
                                    width: 100,
                                    template: function (obj) {
                                        var rest = demorest;
                                        if (isDefined(obj.demorest))
                                            rest = obj.demorest;
                                        return "<p align='center' class=demorestborder>" + rest + "</p>";
                                    },
                                    on:
                                    {
                                        onBeforeRender: webix.once(function () {
                                            if (context != null)
                                            {
                                                let rest = context.getDemoRest(); 
                                                this.setValues({ demorest: rest });
                                            }
                                        })
                                    }
                                }
                            ]
                        },
                        {
                            height: 10
                        }
                    ]
                };
                    
                return dv;            
            };
            this.setupHubs = function () {
                let self = this;
                var setupHub = API.HUBS.setupHubConnection; 
                if (setupHub && !self.demoHub) {
                    setupHub('demoHub', function (demoHubProxy) {
                        if (demoHubProxy) {
                            demoHubProxy.on('updateDemo', self.setDemoRest);
                            //demoHubProxy.onHubConnectionSuccess = function () {};
                            self.demoHub = demoHubProxy;
                        }
                    });
                }
            };
            this.setDemoRest = function (newdata) {
                console.log(new Date(), "setDemoRest: ", newdata);
                var dr = $$("demorest");
                if (dr && isDefined(newdata)) {
                    dr.setValues({ demorest: newdata });
                }
            };
            this.dispose = function () {
                /*
                if (this.demoHub) {
                    this.demoHub.off('updateDemo', this.updateRoutine);
                    this.demoHub.drop();
                    this.demoHub = null;
                }*/
        this.demoHub?.stop();
        this.demoHub = null;
      };
      this.executeDemoInfo = function () {
        if (!this.isDemo()) return;
        var callback = this.setDemoRest;
        var DemoInfo = function () {
          AJAX.get(
            API.FUNC.demoRest,
            null,
            function (xhr, rsp) {
              console.log(rsp)
              if (callback) callback(rsp);
              setTimeout(DemoInfo, 1000);
            },
            function (xhr, err) {
              if (callback) callback('?');
              //messageError(translate("ошибка чтения остатка демо-дней"));
              setTimeout(DemoInfo, 1000);
            }
          );
        };
        DemoInfo();
      };
    },
  };


function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export { API };