<div id="helper" class="modal">
	<div class="modal-content">
		<span class="modalClose">&times;</span>
		<h2><?php p($l->t('How that work ?')); ?></h2>
		<hr/>
		<p><b><?php p($l->t('This application summarizes the workplaces of employees/persons from the calendar.')); ?></b></p>
		<br/>
		<p><?php p($l->t('Just put in the calendar a day event with [loc] at the beginning followed by your workplaces. You can add a comment to your workplaces with ",". Example [loc] PARIS - meet customer !')); ?></p>
		<p><img src="<?php print_unescaped(image_path('whereami', 'example.png')); ?>" /></p>
	</div>
</div>