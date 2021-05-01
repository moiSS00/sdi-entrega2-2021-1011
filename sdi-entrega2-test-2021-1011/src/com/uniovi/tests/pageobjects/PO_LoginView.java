package com.uniovi.tests.pageobjects;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class PO_LoginView extends PO_NavView {

	static public void fillForm(WebDriver driver, String emailp, String passwordp) {

		// Rellenamos el formulario con los datos recibidos como paramteros.
		WebElement email = driver.findElement(By.name("email"));
		email.click();
		email.clear();
		email.sendKeys(emailp);
		WebElement password = driver.findElement(By.name("password"));
		password.click();
		password.clear();
		password.sendKeys(passwordp);


		// Pulsamos el botón para enviar el formulario.
		By boton = By.className("btn");
		driver.findElement(boton).click();
	}

}
