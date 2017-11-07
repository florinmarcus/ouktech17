/**
 * Copyright (c) 2014, 2017, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your customer ViewModel code goes here
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout', 'promise', 'ojs/ojtable', 'ojs/ojarraytabledatasource', 'ojs/ojmodel',
    'ojs/ojtable', 'ojs/ojpagingcontrol', 'ojs/ojcollectiontabledatasource'],
        function (oj, ko, $) {

            function CustomerViewModel() {
                var self = this;

                
               //***********************************************************
               //******************** EMPLOYEES  **************************
               //***********************************************************

                self.EmployeeURL = 'http://127.0.0.1:7101/Tech17SlowData-RESTWebService-context-root/rest/v0/employee';
                self.EmployeeCol = ko.observable();
                self.fetch = function (successCallBack) {
                    self.EmployeeCol().fetch({
                        success: successCallBack,
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.log('Error in fetch: ' + textStatus);
                        }
                    });
                }

                parseEmployee = function (response) {
                    return {EmployeeId: response['EmployeeId'],
                        FirstName: response['FirstName'],
                        LastName: response['LastName'],
                        Email: response['Email'],
                        PhoneNumber: response['PhoneNumber'],
                        Salary: response['Salary']};
                };

                var Employee = oj.Model.extend({
                    urlRoot: self.EmployeeURL,
                    parse: parseEmployee,
                    idAttribute: 'EmployeeId'
                });

                var myEmployee = new Employee();
                var EmployeeCollection = oj.Collection.extend({
                    url: self.EmployeeURL,
                    fetchSize: 10,
                    model: myEmployee
                });
                self.EmployeeCol(new EmployeeCollection());
                self.EmployeeDS = new oj.PagingTableDataSource(new oj.CollectionTableDataSource(self.EmployeeCol()));


                //***********************************************************
                //******************** DEPARTMENTS **************************
                //***********************************************************
                self.DepartmentURL = 'http://127.0.0.1:7101/Tech17SlowData-RESTWebService-context-root/rest/v0/department';
                self.DepartmentCol = ko.observable();
                self.fetch = function (successCallBack) {
                    self.DepartmentCol().fetch({
                        success: successCallBack,
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.log('Error in fetch: ' + textStatus);
                        }
                    });
                }

                parseDepartment = function (response) {
                    return {DepartmentId: response['DepartmentId'],
                        DepartmentName: response['DepartmentName'],
                        LastName: response['LastName'],
                        FirstName: response['FirstName']};
                };

                var Department = oj.Model.extend({
                    urlRoot: self.DepartmentURL,
                    parse: parseDepartment,
                    idAttribute: 'DepartmentId'
                });

                var myDepartment = new Department();
                var DepartmentCollection = oj.Collection.extend({
                    url: self.DepartmentURL,
                    fetchSize: 3,
                    model: myDepartment
                });
                self.DepartmentCol(new DepartmentCollection());
                self.DepartmentDS = new oj.PagingTableDataSource(new oj.CollectionTableDataSource(self.DepartmentCol()));

                
                
                
                self.handleActivated = function (info) {
                    // Implement if needed
                };

                /**
                 * Optional ViewModel method invoked after the View is inserted into the
                 * document DOM.  The application can put logic that requires the DOM being
                 * attached here.
                 * @param {Object} info - An object with the following key-value pairs:
                 * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
                 * @param {Function} info.valueAccessor - The binding's value accessor.
                 * @param {boolean} info.fromCache - A boolean indicating whether the module was retrieved from cache.
                 */
                self.handleAttached = function (info) {
                    // Implement if needed
                };


                /**
                 * Optional ViewModel method invoked after the bindings are applied on this View. 
                 * If the current View is retrieved from cache, the bindings will not be re-applied
                 * and this callback will not be invoked.
                 * @param {Object} info - An object with the following key-value pairs:
                 * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
                 * @param {Function} info.valueAccessor - The binding's value accessor.
                 */
                self.handleBindingsApplied = function (info) {
                    // Implement if needed
                };

                /*
                 * Optional ViewModel method invoked after the View is removed from the
                 * document DOM.
                 * @param {Object} info - An object with the following key-value pairs:
                 * @param {Node} info.element - DOM element or where the binding is attached. This may be a 'virtual' element (comment node).
                 * @param {Function} info.valueAccessor - The binding's value accessor.
                 * @param {Array} info.cachedNodes - An Array containing cached nodes for the View if the cache is enabled.
                 */
                self.handleDetached = function (info) {
                    // Implement if needed
                };
            }

            /*
             * Returns a constructor for the ViewModel so that the ViewModel is constructed
             * each time the view is displayed.  Return an instance of the ViewModel if
             * only one instance of the ViewModel is needed.
             */
            return new CustomerViewModel();
        }
);
