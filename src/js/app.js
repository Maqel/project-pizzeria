import { settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';
import Home from './components/Home.js';

const app = {
  initPages: function () {
    const thisApp = this;
    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.pageLinks = document.querySelectorAll('.main-nav a, a.pageLink');
    const idFromHash = window.location.hash.replace('#/', '');
    let pageMatchingHash = thisApp.pages[0].id;
    for(let page of thisApp.pages) {
      if(page.id == idFromHash){
        pageMatchingHash = page.id;
        break; 
      }
    }
    thisApp.activatePage(pageMatchingHash);
    for(let link of thisApp.pageLinks){
      link.addEventListener('click', function(event){
        const clickedElement = this;
        event.preventDefault();
        /*[DONE]Get page id from href attribute*/
        const id = clickedElement.getAttribute('href').replace('#', '');
        /*[DONE]Run thisApp.activatePage with that id*/
        thisApp.activatePage(id);
        /*[DONE]Change URL hash*/
        window.location.hash = '#/' + id;
      });

    }
    thisApp.initHome(); 
  },
  activatePage: function (pageId){
    const thisApp = this;
    /*Add class active to matching pages, remove from non-matching*/
    for(let page of thisApp.pages){
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }
    /*Add class active to matching links, remove from non-matching*/
    for(let link of thisApp.pageLinks){
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  },
  initMenu: function(){
    const thisApp = this;
    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },
  initData: function () {
    const thisApp = this;
    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.products;

    fetch(url)
      .then(function(rawResponse) {
        return rawResponse.json();
      })
      .then(function(parsedResponse){
        //console.log('parsedResponse', parsedResponse);
        /*[DONE]save parsedResponse as thisApp.data.products*/
        thisApp.data.products = parsedResponse;
        /*[DONE]execute initMenu method*/
        thisApp.initMenu();
      });
    //console.log('thisApp.data', JSON.stringify(thisApp.data));
  },
  initCart: function () { 
    const thisApp = this;
    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);
    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product);
    });
  },
  initBooking: function(){
    const thisApp = this;
    thisApp.bookingWidget = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking(thisApp.bookingWidget);
  },

  initHome: function(){
    const thisApp = this;
    /* find container of home page */
    thisApp.homePage = document.querySelector(select.containerOf.home);
    /* create new instance of class Home and pass home container to it */
    new Home(thisApp.homePage);
  },

  init: function(){
    const thisApp = this;
    //console.log('*** App starting ***');
    //console.log('thisApp:', thisApp);
    //console.log('classNames:', classNames);
    //console.log('settings:', settings);
    //console.log('templates:', templates);
    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
    thisApp.initBooking();
    //thisApp.initHome(); 
  },
  
};

app.init();
