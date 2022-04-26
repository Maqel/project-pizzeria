/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };
  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.processOrder();
      console.log('new Product:', thisProduct);
    }
    renderInMenu(){
      const thisProduct = this;
      /*[DONE]Generate HTML based on template*/
      const generatedHTML = templates.menuProduct(thisProduct.data);
      /*[DONE]Create element using utils.createElementFromHTML*/
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      /*[DONE]find element container*/
      const menuContainer = document.querySelector(select.containerOf.menu);
      /*[DONE]add element to menu*/
      menuContainer.appendChild(thisProduct.element);
    }
    getElements(){
      const thisProduct = this;
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    }
    initAccordion(){
      const thisProduct = this;
      /*[DONE]START: add event listener to clickable trigger on event click*/
      thisProduct.accordionTrigger.addEventListener('click', function(event){
        /*[DONE]Prevent default action for event*/
        event.preventDefault();
        /*[DONE]Find active product (product that has active class)*/
        const activeProduct = document.querySelector(
          select.all.menuProductsActive
        );
        /*[DONE]If there is active product and it's not thisProduct.element, remove class active from it*/
        if (activeProduct != null && activeProduct != thisProduct.element) {
          activeProduct.classList.remove('active');
        }
        /*[DONE]Toggle active class on thisProduct.element*/
        thisProduct.element.classList.toggle('active');
      });
    }
    initOrderForm(){
      const thisProduct = this;
      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      }); 
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
    }
    processOrder(){
      const thisProduct = this;
      /*[DONE]Covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}*/
      const formData = utils.serializeFormToObject(thisProduct.form);
      /*[DONE]Set price to default price*/
      let price = thisProduct.data.price;
      /*[DONE]For every category (param)*/
      for(let paramId in thisProduct.data.params) {
        /*[DONE]Determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }*/
        const param = thisProduct.data.params[paramId];
        /*[DONE]For every option in this category*/
        for(let optionId in param.options) {
          /*[DONE]Determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }*/
          const option = param.options[optionId];
          /*[DONE]Check if there is param with a name of paramId in formData and if it includes optionId*/
          const optionSelected = formData[paramId].includes(optionId);
          /*[DONE]Check if the option is not default*/
          if (!option.default && optionSelected) {
            /*[DONE]Add option price to price variable*/
            price += option.price;
          } 
          else if (option.default && !optionSelected) {
            /*[DONE]Add option price to price variable*/
            price -= option.price;
          }
        } /*[DONE]*END LOOP: For every option in this category*/
      } /*[DONE]*END LOOP: For every category (param)*/
      /*[DONE]Update calculated price in the HTML*/
      thisProduct.priceElem.innerHTML = price;
    }
  }
  const app = {
    initMenu: function(){
      const thisApp = this;
      console.log('thisApp.data:', thisApp.data);
      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },
    initData: function () {
      const thisApp = this;
      thisApp.data = dataSource;
    },
    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initMenu();
    },
  };

  app.init();
}