<?php

class dofri {

	/** Version of dofri */
	var $version = "0.1a";
	/** User's IP */
	var $ip;
	/** Declares whether debugging should be activated */
	var $debug = false;
	
	/** Class constructor **/
	function __construct(){
		global $session;
		$this->sef();
		$this->root = $this->inDofri ? dofri : site;
		$this->debug = runDebug == 'true';
		$this->ip = $this->getIP();
		$this->module = $this->module ?: ($this->inDofri ? array($session->loggedIn ? "dashboard" : "login") : false);
		$this->location = $this->doLocation();
		$this->meta = array();
		$this->favicon = "<link rel='shortcut icon' href='/".($this->inDofri ? "dofri" : "favicon").".ico' />\n";
		$this->title = "<title>dofri {$this->version} {$session->uri}</title>\n";
	}
	
	/** description */
	function tester(){
		
	}
	
}

$dofri = new dofri;

?>