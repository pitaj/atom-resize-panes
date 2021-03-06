module.exports = function(){

  "use strict";

  var max = 95;

  function fullPath(el){
    var names = [];
    while (el.parentNode){
      if (el.id){
        names.unshift('#'+el.id);
        break;
      }else{
        if (el === el.ownerDocument.documentElement){
          names.unshift(el.tagName);
        } else {
          for (var c=1, e=el; e.previousElementSibling; c++){
            e=e.previousElementSibling;
          }
          names.unshift(el.tagName+":nth-child("+c+")");
        }
        el=el.parentNode;
      }
    }
    return names.join(" > ");
  }

  var hashCode = function(str) {
    var hash = 0, i, chr, len;
    if (str.length === 0){
      return hash;
    }
    for (i = 0, len = str.length; i < len; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

  NodeList.prototype.forEach = Array.prototype.forEach;

  atom.workspace.onDidAddPane(delay(onPaneChange, 200));
  atom.workspace.onDidDestroyPane(delay(onPaneChange, 200));
  atom.workspace.onDidAddPaneItem(delay(onPaneChange, 200));
  atom.workspace.onDidDestroyPaneItem(delay(onPaneChange, 200));

  function delay(fn, delay){
    return function(){
      setTimeout(fn, delay);
    };
  }

  onPaneChange();

  function onResize(){
    document.querySelectorAll("atom-pane-axis.vertical > atom-pane:not(:last-child), "+
        "atom-pane-axis.vertical > atom-pane-axis:not(:last-child)").forEach(function(it){
      var parentHeight = parseInt(document.defaultView.getComputedStyle(it.parentNode).height, 10) * max / 100;
      var currentHeight = parseInt(document.defaultView.getComputedStyle(it).height, 10);
      it.style.maxHeight = it.style.minHeight = Math.min(currentHeight, parentHeight) + 'px';
    });
  }

  window.addEventListener("resize", onResize, false);

  function onPaneChange() {

    // ---- Handle horizontal panes ----

    document.querySelectorAll("atom-pane-axis.horizontal > atom-pane-dragger").forEach(function(elem){
      elem.parentNode.removeChild(elem);
    });

    document.querySelectorAll("atom-pane-axis.horizontal > atom-pane:not(:last-child),"+
        " atom-pane-axis.horizontal > atom-pane-axis:not(:last-child)").forEach(function(elem){
      elem.insertAdjacentHTML('afterend', '<atom-pane-dragger class="pane-dragger" tabindex="-1"></atom-pane-dragger>');
    });

    document.querySelectorAll("atom-pane-axis.horizontal > atom-pane-dragger").forEach(function(elem){
      var startWidth, parentWidth, it = elem.previousSibling;

      function doDrag(e) {
        //console.log("dragging", startX, startWidth, e.clientX);
        it.style.maxWidth = it.style.minWidth = Math.min((startWidth + e.clientX) * parentWidth, max) + '%';
      }

      function stopDrag() {
        //console.log("drag stopped");
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
      }

      function initDrag(e) {
        //console.log("drag started");
        startWidth = parseInt(document.defaultView.getComputedStyle(it).width, 10) - e.clientX;
        parentWidth = 100 / parseInt(document.defaultView.getComputedStyle(it.parentNode).width, 10);
        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);
      }

      elem.addEventListener('mousedown', initDrag, false);
    });

    // ---- Handle vertical panes ----

    document.querySelectorAll("atom-pane-axis.vertical > atom-pane-dragger").forEach(function(elem){
      elem.parentNode.removeChild(elem);
    });

    document.querySelectorAll("atom-pane-axis.vertical > atom-pane:not(:last-child), "+
        "atom-pane-axis.vertical > atom-pane-axis:not(:last-child)").forEach(function(elem){
      elem.insertAdjacentHTML('afterend', '<atom-pane-dragger class="pane-dragger" tabindex="-1"></atom-pane-dragger>');
    });

    document.querySelectorAll("atom-pane-axis.vertical > atom-pane-dragger").forEach(function(elem){
      var startHeight, it = elem.previousSibling;
      var parentHeight;

      function doDrag(e) {
        //console.log("dragging", startY, startHeight, e.clientY);
        it.style.maxHeight = it.style.minHeight = Math.min((startHeight + e.clientY), parentHeight) + 'px'; // * parentHeight + '%';
      }

      function stopDrag() {
        //console.log("drag stopped");
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
      }

      function initDrag(e) {
        //console.log("drag started");
        startHeight = parseInt(document.defaultView.getComputedStyle(it).height, 10) - e.clientY;
        //parentHeight = 100 / parseInt(document.defaultView.getComputedStyle(it.parentNode).height, 10);
        parentHeight = parseInt(document.defaultView.getComputedStyle(it.parentNode).height, 10) * max / 100;
        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);
      }

      elem.addEventListener('mousedown', initDrag, false);
    });

    // ---- Save panes on quit ----
    window.addEventListener("beforeunload", function(){
      var panes = [];
      var project = hashCode(atom.project.getPaths().join(";"));

      document.querySelectorAll("atom-pane").forEach(function(elem){
        var csspath = fullPath(elem);
        panes.push({
          path: csspath,
          maxWidth: elem.style.maxWidth,
          minWidth: elem.style.minWidth,
          minHeight: elem.style.minHeight,
          maxHeight: elem.style.maxHeight
        });
      });

      localStorage.setItem("atom-panes-resize:"+project, JSON.stringify(panes));

      //console.log("panes", JSON.stringify(panes));

      //alert("onbeforeunload fired");
    }, false);

    // ---- Load saved panes ----
    (function(){
      var project = hashCode(atom.project.getPaths().join(";"));
      var panes = localStorage.getItem("atom-panes-resize:"+project);

      //console.log("panes", panes);

      if(panes){
        panes = JSON.parse(panes);
        panes.forEach(function(pane){
          var elem = document.querySelector(pane.path);
          if(elem){
            elem.style.maxWidth = pane.maxWidth;
            elem.style.minWidth = pane.minWidth;
            elem.style.maxHeight = pane.maxHeight;
            elem.style.minHeight = pane.minHeight;
          }
        });
      }
    })();

    console.log("atom-resize-panes loaded");

  }

};
