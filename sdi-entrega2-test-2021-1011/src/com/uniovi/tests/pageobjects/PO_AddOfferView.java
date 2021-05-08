package com.uniovi.tests.pageobjects;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class PO_AddOfferView {
	
	static public void fillForm(WebDriver driver, String titlep, String descriptionp, 
			String pricep, boolean destacarp) {

		// Rellenamos el formulario con los datos recibidos como paramteros.
		WebElement title = driver.findElement(By.name("title"));
		title.click();
		title.clear();
		title.sendKeys(titlep);
		WebElement description = driver.findElement(By.name("description"));
		description.click();
		description.clear();
		description.sendKeys(descriptionp);
		WebElement price = driver.findElement(By.name("price"));
		price.click();
		price.clear();
		price.sendKeys(pricep);
		if (destacarp) {
			WebElement checkFeatured = driver.findElement(By.name("featured"));
			checkFeatured.click();
		}

		// Pulsamos el botón para enviar el formulario.
		By boton = By.className("btn");
		driver.findElement(boton).click();
	}

}
