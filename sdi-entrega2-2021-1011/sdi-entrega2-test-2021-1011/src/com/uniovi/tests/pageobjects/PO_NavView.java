package com.uniovi.tests.pageobjects;

import static org.junit.Assert.assertTrue;

import java.util.List;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import com.uniovi.tests.util.SeleniumUtils;

public class PO_NavView  extends PO_View{

	/**
	 * CLicka una de las opciones principales (a href) y comprueba que se vaya a la vista con el elemento de tipo type con el texto Destino
	 * @param driver: apuntando al navegador abierto actualmente.
	 * @param textOption: Texto de la opción principal.
	 * @param criterio: "id" or "class" or "text" or "@attribute" or "free". Si el valor de criterio es free es una expresion xpath completa. 
	 * @param textoDestino: texto correspondiente a la búsqueda de la página destino.
	 */
	public static void clickOption(WebDriver driver, String textOption, String criterio, String textoDestino) {
		//CLickamos en la opción de registro y esperamos a que se cargue el enlace de Registro.
		List<WebElement> elementos = SeleniumUtils.EsperaCargaPagina(driver, "@href", textOption, getTimeout());
		//Tiene que haber un sólo elemento.
		assertTrue(elementos.size()==1);
		//Ahora lo clickamos
		elementos.get(0).click();
		//Esperamos a que sea visible un elemento concreto
		elementos = SeleniumUtils.EsperaCargaPagina(driver, criterio, textoDestino, getTimeout());
		//Tiene que haber un sólo elemento.
		assertTrue(elementos.size()==1);	
	}
	
	/**
	 * Hacemos un logout
	 * @param driver
	 */
	public static void logOut(WebDriver driver) {
		clickOption(driver, "/logout", "text", "Identificaci?n de usuario");
	}
	
	/**
	 * Nos logeamos como un usuario determinado 
	 * @param driver
	 * @param username
	 * @param password
	 */
	public static void logInAs(WebDriver driver, String username, String password) {
		// Vamos al formulario de identificacion
		PO_NavView.clickOption(driver, "/login", "text", "Identificaci?n de usuario");

		// Iniciamos sesi?n como usuario est?ndar
		PO_LoginView.fillForm(driver, username, password);
	}

	/**
	 * Vamos a la lista para a?adir una oferta 
	 * @param driver
	 */
	public static void displayOffersMenu(WebDriver driver, String href) {
		List<WebElement> elements = PO_View.checkElement(driver, "id", "offers-menu");
		elements.get(0).click();
		elements = PO_View.checkElement(driver, "@href", href);
		assertTrue(elements.size() == 1);
		elements.get(0).click();
	}


}
