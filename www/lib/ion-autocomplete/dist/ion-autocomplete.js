(function() {

'use strict';

angular.module('ion-autocomplete', []).directive('ionAutocomplete', [
    '$ionicTemplateLoader', '$ionicBackdrop', '$rootScope', '$document', '$q', '$parse',
    function ($ionicTemplateLoader, $ionicBackdrop, $rootScope, $document, $q, $parse) {
        return {
            require: '?ngModel',
            restrict: 'E',
            template: '<input type="text" readonly="readonly" class="ion-autocomplete" autocomplete="off">',
            replace: true,
            scope: {
                placeholder_: '@',
                cancelLabel: '@',
                selectItemsLabel: '@',
                searchQueryItemHint: '@',
                selectedItemsLabel: '@',
                localLabel: '@',
                globalLabel: '@',
                templateUrl: '@',
                itemsMethod: '&',
                itemsMethod2: '&',
                itemsMethodValueKey: '@',
                itemsMethodValueKey2: '@',
                itemValueKey: '@',
                itemViewValueKey: '@',
                multipleSelect: '@',
                itemsClickedMethod: '&'
            },
            link: function (scope, element, attrs, ngModel) {

                // do nothing if the model is not set
                if (!ngModel) return;

                // set the default values of the passed in attributes
                scope.localLabel    = !scope.localLabel ? '' : scope.localLabel;
                scope.globalLabel   = !scope.globalLabel ? '' : scope.globalLabel;
                scope.searchQueryItemHint = !scope.searchQueryItemHint ? '' : scope.searchQueryItemHint;
                scope.placeholder_ = !scope.placeholder_ ? 'Click to enter a value...' : scope.placeholder_;
                scope.cancelLabel = !scope.cancelLabel ? scope.multipleSelect === "true" ? 'Done' : 'Cancel' : scope.cancelLabel;
                scope.selectItemsLabel = !scope.selectItemsLabel ? 'Select an item...' : scope.selectItemsLabel;
                scope.selectedItemsLabel = !scope.selectedItemsLabel ? 'Selected items:' : scope.selectedItemsLabel;
                scope.templateUrl = !scope.templateUrl ? '' : scope.templateUrl;

                // the items, selected items and the query for the list
                scope.items = [];
                scope.items2 = [];
                scope.selectedItems = [];
                scope.searchQuery = '';
                scope.cerda_ = false;

                scope.getSearchQueryItem = function(){
                    return {id:0, name:scope.searchQuery, is_search_query:true};
                }

                // returns the value of an item
                scope.getItemValue = function (item, key) {

                    // if it's an array, go through all items and add the values to a new array and return it
                    if (angular.isArray(item)) {
                        var items = [];
                        angular.forEach(item, function (itemValue) {
                            if (key && angular.isObject(item)) {
                                items.push($parse(key)(itemValue));
                            } else {
                                items.push(itemValue);
                            }
                        });
                        return items;
                    } else {
                        if (key && angular.isObject(item)) {
                            return $parse(key)(item);
                        }
                    }
                    // console.log('ion autocomplete mostrando item:'+item);
                    return item;
                };

                // the search container template
                var searchContainerTemplate = [
                    '<div class="ion-autocomplete-container modal">',
                    '<div class="bar bar-header item-input-inset">',
                    '<label class="item-input-wrapper">',
                    '<i class="icon ion-ios7-search placeholder-icon"></i>',
                    '<input type="search" class="ion-autocomplete-search" ng-model="searchQuery" placeholder="{{placeholder_}}"/>',
                    '</label>',
                    '<button class="ion-autocomplete-cancel button button-clear">{{cancelLabel}}</button>',
                    '</div>',
                    '<ion-content class="has-header has-header">',
                    '<ion-list>',
                    
                    //'<ion-item class="item-divider" ng-show="selectedItems.length > 0">{{selectedItemsLabel}}</ion-item>',
                    
                    // '<ion-item ng-repeat="selectedItem in selectedItems" type="item-text-wrap" class="item-icon-left item-icon-right">',
                    // '<i class="icon ion-checkmark"></i>',
                    // '{{getItemValue(selectedItem, itemViewValueKey)}}',
                    // '<i class="icon ion-trash-a" style="cursor:pointer" ng-click="removeItem($index)"></i>',
                    // '</ion-item>',
                    
                    // '<ion-item class="item-divider" ng-show="items.length > 0">{{selectItemsLabel}}</ion-item>',
                    
                    // '<ion-item collection-repeat="item in items" item-height="55" item-width="100%" type="item-text-wrap" ng-click="selectItem(item)">',
                    // '{{getItemValue(item, itemViewValueKey)}}',
                    // '</ion-item>',
                    
                    '<ion-item item-height="55" item-width="100%" class="search" ng-show="searchQuery.length>0" type="item-text-wrap" ng-click="selectItem(getSearchQueryItem())">',
                    '{{searchQuery}}',
                    '<p ng-show="searchQueryItemHint.length>0">{{searchQueryItemHint}}</p>',
                    '</ion-item>',
                    

                    '<div class="collection-repeat-container">',
                    '<ion-item type="item-text-wrap" class="item-divider item-icon-right" ng-show="items.length > 0">',
                    '{{localLabel}}',
                    '<i class="icon ion-ios-people"></i>',
                    '</ion-item>',

                    '<ion-item ng-repeat="item in items" item-height="55" item-width="100%" class="local" type="item-text-wrap" ng-click="selectItem(item)">',
                    '{{getItemValue(item, itemViewValueKey)}}',
                    '</ion-item>',
                    '</div>',

                    '<div class="collection-repeat-container">',
                    '<ion-item type="item-text-wrap" class="item-divider item-icon-right" ng-show="items2.length > 0">',
                    '{{globalLabel}}',
                    '<i class="icon ion-earth""></i>',
                    '</ion-item>',
                    
                    '<ion-item item-height="55" item-width="100%" ng-show="cerda_" type="item-text-wrap" >',
                    '<ion-spinner icon="android"></ion-spinner>',
                    '</ion-item>',


                    '<ion-item ng-repeat="item in items2" item-height="55" item-width="100%" class="global" type="item-text-wrap" ng-click="selectItem(item)">',
                    //'{{item.name}}',
                    '{{getItemValue(item, itemViewValueKey)}}',
                    '</ion-item>',
                    '</div>',

                    // '<ion-item collection-repeat="item in items2" item-height="55" item-width="100%" style="color:#0000FF;" type="item-text-wrap" ng-click="selectItem(item)">',
                    // '{{getItemValue(item, itemViewValueKey)}}',
                    // '</ion-item>',

                    
                    '</ion-list>',

                    /*'<ion-list>',
                    '<ion-item collection-repeat="item in items2" item-height="55" item-width="100%" style="color:#0000FF;" type="item-text-wrap" ng-click="selectItem(item)">',
                    '{{getItemValue(item, itemViewValueKey)}}',
                    '</ion-item>',
                    '</ion-list>',
*/
                    '</ion-content>',
                    '</div>'
                ].join('');

                // compile the popup template
                $ionicTemplateLoader.compile({
                    templateUrl: scope.templateUrl,
                    template: searchContainerTemplate,
                    scope: scope,
                    appendTo: $document[0].body
                }).then(function (compiledTemplate) {

                    // get the compiled search field
                    var searchInputElement = angular.element(compiledTemplate.element.find('input'));

                    // function which selects the item, hides the search container and the ionic backdrop if it is not a multiple select autocomplete
                    compiledTemplate.scope.selectItem = function (item) {

                        // clear the items and the search query
                        compiledTemplate.scope.items = [];
                        compiledTemplate.scope.searchQuery = '';

                        // if multiple select is on store the selected items
                        if (compiledTemplate.scope.multipleSelect === "true") {

                            if (!isKeyValueInObjectArray(compiledTemplate.scope.selectedItems,
                                    compiledTemplate.scope.itemValueKey, scope.getItemValue(item, scope.itemValueKey))) {
                                // create a new array to update the model. See https://github.com/angular-ui/ui-select/issues/191#issuecomment-55471732
                                compiledTemplate.scope.selectedItems = compiledTemplate.scope.selectedItems.concat([item]);
                            }

                            // set the view value and render it
                            ngModel.$setViewValue(compiledTemplate.scope.selectedItems);
                            ngModel.$render();
                        } else {
                            // set the view value and render it
                            ngModel.$setViewValue(item);
                            ngModel.$render();

                            // // hide the container and the ionic backdrop
                            compiledTemplate.element.css('display', 'none');
                            $ionicBackdrop.release();
                        }

                        // call items clicked callback
                        if (angular.isFunction(compiledTemplate.scope.itemsClickedMethod)) {
                            compiledTemplate.scope.itemsClickedMethod({
                                callback: {
                                    item: item,
                                    selectedItems: compiledTemplate.scope.selectedItems.slice()
                                }
                            });
                        }
                    };

                    // function which removes the item from the selected items.
                    compiledTemplate.scope.removeItem = function (index) {
                        // remove the item from the selected items and create a copy of the array to update the model.
                        // See https://github.com/angular-ui/ui-select/issues/191#issuecomment-55471732
                        compiledTemplate.scope.selectedItems.splice(index, 1);
                        compiledTemplate.scope.selectedItems = compiledTemplate.scope.selectedItems.slice();

                        // set the view value and render it
                        ngModel.$setViewValue(compiledTemplate.scope.selectedItems);
                        ngModel.$render();
                    };

                    // watcher on the search field model to update the list according to the input
                    compiledTemplate.scope.$watch('searchQuery', function (query) {

                        // if the search query is empty, clear the items
                        //if (query == '') {
                            compiledTemplate.scope.items = [];
                            compiledTemplate.scope.items2 = [];
                        //}

                        if (query && angular.isFunction(compiledTemplate.scope.itemsMethod)) {

                            // convert the given function to a $q promise to support promises too
                            var promise = $q.when(compiledTemplate.scope.itemsMethod({query: query}));

                            promise.then(function (promiseData) {
                                // set the items which are returned by the items method
                                compiledTemplate.scope.items = compiledTemplate.scope.getItemValue(promiseData,
                                    compiledTemplate.scope.itemsMethodValueKey);
                            }, function (error) {
                                // reject the error because we do not handle the error here
                                return $q.reject(error);
                            });
                        }

                        if (query && angular.isFunction(compiledTemplate.scope.itemsMethod2)) {
                            scope.cerda_ = true;
                            // convert the given function to a $q promise to support promises too
                            var promise = $q.when(compiledTemplate.scope.itemsMethod2({query: query}));

                            promise.then(function (promiseData) {
                                // set the items which are returned by the items method
                                compiledTemplate.scope.items2 = compiledTemplate.scope.getItemValue(promiseData,
                                    compiledTemplate.scope.itemsMethodValueKey2);
                                scope.cerda_ = false;
                            }, function (error) {
                                // reject the error because we do not handle the error here
                                scope.cerda_ = false;
                                return $q.reject(error);
                            });
                        }

                    });

                    // click handler on the input field which
                    var onClick = function (event) {

                        // prevent the default event and the propagation
                        event.preventDefault();
                        event.stopPropagation();

                        // show the ionic backdrop and the search container
                        $ionicBackdrop.retain();
                        compiledTemplate.element.css('display', 'block');

                        // focus on the search input field
                        if (searchInputElement.length > 0) {
                            searchInputElement[0].focus();
                            setTimeout(function () {
                                searchInputElement[0].focus();
                            }, 0);
                        }
                    };

                    var isKeyValueInObjectArray = function (objectArray, key, value) {
                        for (var i = 0; i < objectArray.length; i++) {
                            if (scope.getItemValue(objectArray[i], key) === value) {
                                return true;
                            }
                        }
                        return false;
                    };

                    // bind the onClick handler to the click and touchend events
                    element.bind('click', onClick);
                    element.bind('touchend', onClick);

                    // cancel handler for the cancel button which clears the search input field model and hides the
                    // search container and the ionic backdrop
                    compiledTemplate.element.find('button').bind('click', function (event) {
                        compiledTemplate.scope.searchQuery = '';
                        $ionicBackdrop.release();
                        compiledTemplate.element.css('display', 'none');
                    });

                });

                // render the view value of the model
                ngModel.$render = function () {
                    element.val(scope.getItemValue(ngModel.$viewValue, scope.itemViewValueKey));
                };

                // set the view value of the model
                ngModel.$formatters.push(function (modelValue) {
                    return scope.getItemValue(modelValue, scope.itemViewValueKey);
                });

                // set the model value of the model
                ngModel.$parsers.push(function (viewValue) {
                    return scope.getItemValue(viewValue, scope.itemValueKey);
                });

            }
        };
    }
]);
})();