/*jshint unused:false,evil:true*/

$(window).on('appready', function (e)
{

    if (typeof template !== "object")
        return;

    webix.ajax('/assets/i18n/' + i18next.language + ".json").then(function (res)
    {
        i18next.addResourceBundle(i18next.language, 'assets', res.json(), true);
        document.title = translate("Scheme");;
        template.interactive = true;
       
        var init = function ()
        {
            let editorRoot = '/thirdparty/mxgraph/editor/';
            
            // initialization
            this.mxBasePath = "/thirdparty/mxgraph/";
            // js path
            this.JS_PATH = editorRoot;

            // Public global variables
            this.MAX_REQUEST_SIZE = this.MAX_REQUEST_SIZE || 10485760;
            this.MAX_AREA = this.MAX_AREA || 15000 * 15000;

            this.RESOURCES_PATH = editorRoot + "res";
       
            this.RESOURCE_BASE = editorRoot + 'i18n/scheme';

            // disable default resources
            this.mxLoadResources = false;
            this.mxLoadStylesheets = false;

            this.mxLanguages = ['ru', 'en', 'fr'];
            this.mxLanguage = webix.storage.local.get("app.locale");
            this.mxDefaultLanguage = "en";
        };
        
        var buildViewer = function (scheme)
        {
            if (!isDefined(scheme))
                return;

            mxResources.loadDefaultBundle = false;
            var bundle = mxResources.getDefaultBundle(RESOURCE_BASE, mxLanguage) || mxResources.getSpecialBundle(RESOURCE_BASE, mxLanguage);

            var themes = new Object();
            mxUtils.getAll([bundle, RESOURCES_PATH + '/default.xml'],
                function (xhr)
                {
                    // Adds bundle text to resources
                    mxResources.parse(xhr[0].getText());
                    // Configures the default graph theme
                    themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement();
                    // Build viewer
                    window.viewer = new EditorUi(new Editor(true, themes), document.getElementById('viewer'), scheme);
                },
                function ()
                {
                    messageError("Ошибка загрузки ресурсных файлов.");
                });
        };

        template.buildPageLayout = function (complete)
        {
            init.apply(window);
//---->fix<-------//

            // if (isNullOrEmpty(urlParams['id']))
            // {
            //     if (complete)
            //         complete();
            //     return;
            // }

            const id = '2251b1c0-f0a3-4979-99c3-caa251ff3cd2'
            if (isNullOrEmpty(id))
            {
                if (complete)
                    complete();
                return;
            }
//---->fix<-------//
            let schemeUI = webix.ui({
                id: 'contentview',
                container: "layout",
                type: "clean",
                template: "<div class='geViewer' id='viewer'></div>"
            });
            webix.require([
                mxBasePath + 'mxClient.min.js',
                JS_PATH + 'Init.js',
                JS_PATH + 'EditorUi.js',
                JS_PATH + 'Editor.js',
                JS_PATH + 'Sidebar.js',
                JS_PATH + 'Graph.js',
                JS_PATH + 'Shapes.js',
                JS_PATH + 'Bindings.js',
                JS_PATH + 'Actions.js',
                JS_PATH + 'Menus.js',
                JS_PATH + 'Dialogs.js',
                JS_PATH + 'ViewMode.js',
                JS_PATH + 'Scripts.js',
                JS_PATH + 'MarksService.js',
            ], function ()
                {
                    if (complete)
                        complete(schemeUI);
                });
        };

       

        template.buildTemplateComplete = function ()
        {
            
            if (!window.mxClient)
            return;
            
            if (!mxClient.isBrowserSupported())
            {
                messageError('Извините! Ваш браузер не поддерживается.');
                return;
            }
            const LoadGraph = async () => {
                const response = await  fetch('/assets/1x4kПС-1103510.txt')
                const text = await response.text()
                const r = {
                    id: '2251b1c0-f0a3-4979-99c3-caa251ff3cd2',
                    model: text,
                    name:'1x4kПС-1103510',
                    version: '3.0'
                }
                buildViewer.apply(window, [r]);
            }
            LoadGraph()
            // AJAX.get(API.FUNC.schemeGet, 'id=' + urlParams['id'],
            //     function (xhr, r)
            //     {
            //         if (isDefined(r))
            //             buildViewer.apply(window, [r]);
            //     },
            //     function (xhr, err)
            //     {
            //         messageError(translate('scheme.errors.load'));
            //     });
        };

        var templateDestructor = template.onDestruct;
        template.onDestruct = function ()
        {
            console.log('onDestruct()')
            templateDestructor();
            if (window.viewer != null)
                window.viewer.destroy();
        };

        try
        {
            template.ready();
        }
        catch (e)
        {
            HELP.log(e);
            messageError(translate('scheme:errors.init_viewer'));
        }
    });
});