/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
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
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 10,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
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
      thisProduct.initAmountWidget();
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
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
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
          /*[IMG][DONE]Find image fit to .paramId-optionId*/
          const classImg = '.' + paramId + '-' + optionId;
          /*[IMG][DONE]Check if it was found*/
          let optionImage = thisProduct.imageWrapper.querySelector(classImg);
          /*[IMG][DONE]Checking if an option is selected.*/
          if (optionImage != null) {
            if (optionSelected) {
              /*[IMG][DONE]Add class active & remove this class in next step*/
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            }
            else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        } /*[DONE]*END LOOP: For every option in this category*/
      } /*[DONE]*END LOOP: For every category (param)*/
      /*Multiply price by amount*/
      price *= thisProduct.amountWidget.value;
      /*[DONE]Update calculated price in the HTML*/
      thisProduct.priceElem.innerHTML = price;
    }

    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function() {
        thisProduct.processOrder();
      });
    }

  }

  class AmountWidget{
    constructor(element){
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.initActions();
      thisWidget.setValue(thisWidget.input.value);

      console.log('AmountWidget:', thisWidget);
      console.log('constructor arguments:', element);
    }
    getElements(element){
      const thisWidget = this;
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
      thisWidget.value = settings.amountWidget.defaultValue;
    }
    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);
      /*Add validation*/
      if(thisWidget.value 
        !== newValue 
        && !isNaN(newValue) 
        && value >= settings.amountWidget.defaultMin 
        && value <= settings.amountWidget.defaultMax) {
        thisWidget.announce();
        thisWidget.value = newValue; 
      }
      
      thisWidget.input.value = thisWidget.value;
    }
    initActions(){
      const thisWidget = this;
      thisWidget.input.addEventListener('change', function() {
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
    announce(){
      const thisWidget = this;
      const event = new CustomEvent('updated' );
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart{
    constructor(element){
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      console.log('new Cart', thisCart);
    }
    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    }
    initActions(){
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault(); 
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
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
    initCart: function () {
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
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
      thisApp.initCart();
    },
    
  };

  app.init();
}