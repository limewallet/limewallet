bitwallet_module
.directive('oneClick', function ($parse) {
    return {
        compile: function ($element, attr) {
            var handler = $parse(attr.oneClick);
            return function (scope, element, attr) {
                element.on('click', function (event) {
                    scope.$apply(function () {
                        var promise = handler(scope, {$event: event});
                        if (promise && angular.isFunction(promise.finally)) {
                            element.attr('disabled', true);
                            promise.finally(function () {
                                element.attr('disabled', false);
                            });
                        }
                    });
                });
            };
        }
    };
});
