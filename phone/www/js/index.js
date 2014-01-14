/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */


function getFileSystem(callback) {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
        // success get file system
        var sdcard = fileSystem.root;
        sdcard.getDirectory('dcim/Camera', {create: false}, function(dcim) {
            listDir(dcim, callback);
        }, function(error) {
            alert(error.code);
        })
    }, function(evt){ // error get file system
        console.log(evt.target.error.code);
    });
}
            
function listDir(directoryEntry, callback){
    var directoryReader = directoryEntry.createReader();
         
    directoryReader.readEntries(function(entries) { // success get files and folders
        callback(entries.map(function(entry) { return entry.fullPath; }));;
//        for (var i = 0; i < entries.length; ++i){
//            console.log(entries[i].name);
//            var img = document.getElementById("img");
//            img.src = entries[i].fullPath;
//        }
    }, function(error) { // error get files and folders
        alert(error.code);
    });
}


var app = {
    // Application Constructor
    initialize: function() {
//        this.bindEvents();
        var g = document.getElementById("gallery");
        new Gallery(g).setContent([
            "img/IMG_20140108_174405213.jpg",
            "img/IMG_20140108_174406969.jpg",
            "img/IMG_20140108_220335579.jpg",
            "img/IMG_20140108_220336102.jpg",
            "img/IMG_20140108_220336660.jpg",
            "img/IMG_20140108_220337241.jpg",
            "img/IMG_20140108_220337821.jpg"
        ]);
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        
        getFileSystem(function(urls) {
            var galleryDiv = document.getElementById("gallery");
            var gallery = new Gallery(galleryDiv);
            gallery.setContent(urls);
        });
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    
};
